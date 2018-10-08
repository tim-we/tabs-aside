import TabData from "./TabData";
import * as OptionsManager from "../options/OptionsManager";
import FuncIterator from "../util/FuncIterator";
import {
	Tab, Bookmark, Window,
	TabCreatedListener,
	TabRemoveListener,
	TabUpdatedListener,
	TabAttachedListener,
	TabDetachedListener
} from "../util/Types";
import { SessionContentUpdate } from "../messages/Messages";

export interface ActiveSessionData {
	readonly bookmarkId;
	readonly title:string;
	readonly windowId:number;
	readonly tabs:number[];
}

export default class ActiveSession {
	public readonly bookmarkId:string;
	private title:string;
	private windowId:number;
	
	// maps tab ids to bookmark ids
	private tabs:Map<number, string> = new Map();

	// event listeners
	private tabAttachedListener:TabAttachedListener;
	private tabDetachedListener:TabDetachedListener;
	private tabCreatedListener:TabCreatedListener;
	private tabRemovedListener:TabRemoveListener;
	private tabUpdatedListener:TabUpdatedListener;

	constructor(sessionBookmark:Bookmark) {
		this.bookmarkId = sessionBookmark.id;
		this.title = sessionBookmark.title;
	}

	private static async restore(sessionBookmark:Bookmark, tabBookmark?:Bookmark):Promise<ActiveSession> {
		// create ActiveSession instance
		let activeSession:ActiveSession = new ActiveSession(sessionBookmark);

		let windowedSession:boolean = await OptionsManager.getValue<boolean>("windowedSession");
		let emptyTab:Tab = null;

		if(windowedSession) {
			// windowed mode
			let wnd:Window = await activeSession.createSessionWindow(sessionBookmark);
			// new window contains a "newtab" tab
			emptyTab = wnd.tabs[0];
		}

		// open a single tab or all tabs
		let tabsToOpen:Bookmark[] = tabBookmark ? [tabBookmark] : sessionBookmark.children;

		// add tabs
		await Promise.all(
			tabsToOpen.map(
				tabBookmark => activeSession.openBookmarkTab(tabBookmark)
			)
		);

		// new window contains a "newtab" tab
		// -> close it after sessions tabs are restored
		if(emptyTab) {
			browser.tabs.remove(emptyTab.id);
		}

		if(!windowedSession) {
			// the session does not have its own window -> highlight tabs
			activeSession.hightlight();
		}

		activeSession.setEventListeners();

		return activeSession;
	}

	/**
	 * Creates an active session and restores all tabs.
	 * @param sessionId - The bookmark id of the session to be restored
	 */
	public static async restoreAll(sessionId:string):Promise<ActiveSession> {
		// get session bookmark & children
		let sessionBookmark:Bookmark = (await browser.bookmarks.getSubTree(sessionId))[0];
		console.assert(sessionBookmark && sessionBookmark.children.length > 0);

		return await ActiveSession.restore(sessionBookmark);
	}

	/**
	 * Creates an active session but restores only a single tab.
	 * @param tabBookmark - The bookmark of the tab to restore
	 */
	public static async restoreSingleTab(tabBookmark:Bookmark):Promise<ActiveSession> {
		// parent bookmark = session bookmark
		let sessionId:string = tabBookmark.parentId;
		let sessionBookmark:Bookmark = (await browser.bookmarks.get(sessionId))[0];

		return await ActiveSession.restore(sessionBookmark, tabBookmark);
	}

	/**
	 * Adds an existing tab to the active session.
	 * If no bookmark id is passed as a second argument a new bookmark will be created.
	 * @param tab - A browser tab
	 * @param tabBookmarkId - (Optional) The id of the bookmark representing this tab
	 */
	public async addExistingTab(tab:Tab, tabBookmarkId?:string):Promise<void> {
		if(!tabBookmarkId) {
			// create a bookmark for this tab
			let tabBookmark:Bookmark = await browser.bookmarks.create(
				TabData.createFromTab(tab).getBookmarkCreateDetails(this.bookmarkId)
			);

			tabBookmarkId = tabBookmark.id;
		}

		// store session info via the sessions API
		await Promise.all([
			browser.sessions.setTabValue(tab.id, "sessionID", this.bookmarkId),
			browser.sessions.setTabValue(tab.id, "bookmarkID", tabBookmarkId)
		]);

		this.tabs.set(tab.id, tabBookmarkId);
	}

	/**
	 * Open a tab from a bookmark and add it to this session
	 * @param tabBookmark - A bookmark from this session
	 */
	public async openBookmarkTab(tabBookmark:Bookmark):Promise<Tab> {
		console.assert(tabBookmark && tabBookmark.parentId === this.bookmarkId);

		let data:TabData = TabData.createFromBookmark(tabBookmark);
		let createProperties = data.getTabCreateProperties();

		if(this.windowId) {
			createProperties.windowId = this.windowId;
		}

		let browserTab:Tab = await browser.tabs.create(createProperties);

		await this.addExistingTab(browserTab, tabBookmark.id);

		return browserTab;
	}

	public async setAside():Promise<void> {
		this.removeEventListeners();

		if(this.windowId) {
			this.tabs = new Map();

			await browser.windows.remove(this.windowId);
		} else {
			await browser.tabs.remove(this.getTabsIds());
		}
	}

	private getTabsIds():number[] {
		return Array.from(this.tabs.keys());
	}

	private async createSessionWindow(sessionBookmark?:Bookmark):Promise<Window> {
		// create session window
		let wnd:Window = await browser.windows.create(
			sessionBookmark ? {
				titlePreface: sessionBookmark.title + " | "
			} : {}
		);

		this.windowId = wnd.id;
		await browser.sessions.setWindowValue(wnd.id, "sessionID", this.bookmarkId);

		return wnd;
	}

	public getData():ActiveSessionData {
		return {
			bookmarkId: this.bookmarkId,
			title: this.title,
			windowId: this.windowId,
			tabs: this.getTabsIds()
		};
	}

	public async hightlight():Promise<void> {
		let tabIds:number[] = this.getTabsIds();
		// avoid browser errors
		if(tabIds.length === 0) { return; }

		let tabs:Tab[] = await Promise.all(
			tabIds.map(
				tabId => browser.tabs.get(tabId)
			)
		);

		browser.tabs.highlight({
			tabs: tabs.map(tab => tab.index)
		}).catch(() => {
			console.log("[TA] Tab highlighting failed. This is most likely due to browser.tabs.multiselect not being enabled.");
		});
	}

	private async setEventListeners() {
		let removeTabs:boolean = (await OptionsManager.getValue<string>("tabClosingBehavior")) === "remove-tab";

		let tabRemovedFromSession = async (tabId:number) => {
			let tabBookmarkId:string = this.tabs.get(tabId);

			// check if tab is part of this session
			if(tabBookmarkId) {
				// remove tab
				this.tabs.delete(tabId);

				if(removeTabs) {
					await browser.bookmarks.remove(tabBookmarkId);
				}

				if(this.tabs.size === 0) {
					if(removeTabs) {
						let tabBookmarks:Bookmark[] = await browser.bookmarks.getChildren(this.bookmarkId);

						if(tabBookmarks.length === 0) {
							await browser.bookmarks.remove(this.bookmarkId);
						}
					}

					//TODO: "close" active session
				}

				// update sidebar
				SessionContentUpdate.send(this.bookmarkId);
			}
		};

		this.tabRemovedListener  = tabRemovedFromSession;
		this.tabDetachedListener = tabRemovedFromSession;

		this.tabAttachedListener = async (tabId, attachInfo) => {
			if(attachInfo.newWindowId === this.windowId) {
				let tab:Tab = await browser.tabs.get(tabId);
				this.addExistingTab(tab);

				// update sidebar
				SessionContentUpdate.send(this.bookmarkId);
			}
		};

		this.tabUpdatedListener = async (tabId, changeInfo, tab) => {
			let tabBookmarkId:string = this.tabs.get(tabId);

			// check if tab loaded & part of this session
			if(tabBookmarkId) {
				// only update session for certain changes
				let update:boolean = changeInfo.hasOwnProperty("url")
					|| changeInfo.hasOwnProperty("title")
					|| changeInfo.hasOwnProperty("mutedInfo")
					|| changeInfo.hasOwnProperty("pinned");

				if(update) {
					console.log(changeInfo);
					// update this Tabs bookmark
					await browser.bookmarks.update(
						tabBookmarkId,
						TabData.createFromTab(tab).getBookmarkUpdate()
					);

					// update sidebar
					SessionContentUpdate.send(this.bookmarkId);
				}
			}
		};

		this.tabCreatedListener = async (tab) => {
			/* determine if tab should be added to the session
			 * the tab should be added if:
			 * - tab is part of the sessions window (windowed mode)
			 * - tab was opened by/from a tab from this session
			*/
			let addToSession:boolean = tab.windowId === this.windowId
				|| (tab.hasOwnProperty("openerTabId") && this.tabs.has(tab.openerTabId));

			if(addToSession) {
				this.addExistingTab(tab);

				// update sidebar
				SessionContentUpdate.send(this.bookmarkId);
			}
		};

		// add event listeners
		browser.tabs.onAttached.addListener(this.tabAttachedListener);
		browser.tabs.onDetached.addListener(this.tabDetachedListener);
		browser.tabs.onCreated.addListener(this.tabCreatedListener);
		browser.tabs.onRemoved.addListener(this.tabRemovedListener);
		browser.tabs.onUpdated.addListener(this.tabUpdatedListener);
	}

	private removeEventListeners() {
		browser.tabs.onAttached.removeListener(this.tabAttachedListener);
		browser.tabs.onDetached.removeListener(this.tabDetachedListener);

		browser.tabs.onCreated.removeListener(this.tabCreatedListener);
		browser.tabs.onRemoved.removeListener(this.tabRemovedListener);
		browser.tabs.onUpdated.removeListener(this.tabUpdatedListener);
	}
}