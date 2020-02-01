import TabData from "./TabData.js";
import * as OptionsManager from "../options/OptionsManager.js";
import {
	Tab, Bookmark, Window,
	TabCreatedListener,
	TabRemoveListener,
	TabUpdatedListener,
	TabAttachedListener,
	TabDetachedListener,
	WindowRemovedListener
} from "../util/Types";
import { SessionContentUpdate } from "../messages/Messages.js";
import * as ActiveSessionManager from "./ActiveSessionManager.js";

type TabBookmark = [number, string];
const TAB_REMOVE_DELAY = 250;
const INITIAL_LOADING_TIMEOUT = 1000;

export interface ActiveSessionData {
	readonly bookmarkId;
	readonly title:string;
	readonly windowId:number;
	readonly tabs:number[];
}

export default class ActiveSession {
	public readonly bookmarkId:string;
	private readonly title:string;
	private windowId:number;
	
	// maps tab ids to bookmark ids
	private tabs:Map<number, string> = new Map();
	
	// removing tabs needs to be delayed because there is no API to detect window closing
	// https://bugzilla.mozilla.org/show_bug.cgi?id=1399885
	private bookmarkRemoveQueue:string[] = [];
	private removeTimeoutId:number = 0;

	// this is needed to avoid duplicate bookmarks for tabs activated via the sidebar
	private ignoreNextCreatedTab:boolean = false;

	private readonly sessionStartTime:number;

	// event listeners
	private tabAttachedListener:TabAttachedListener;
	private tabDetachedListener:TabDetachedListener;
	private tabCreatedListener:TabCreatedListener;
	private tabRemovedListener:TabRemoveListener;
	private tabUpdatedListener:TabUpdatedListener;
	private wndRemovedListener:WindowRemovedListener;

	constructor(sessionBookmark:Bookmark) {
		this.bookmarkId = sessionBookmark.id;
		this.title = sessionBookmark.title;
		this.sessionStartTime = Date.now();
	}

	/** Restores a session. If `tabBookmark` is set then only this single tab is restored. */
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
				bookmark => activeSession.openBookmarkTab(bookmark, false)
			)
		);

		// new window contains a "newtab" tab
		// -> close it after sessions tabs are restored
		if(emptyTab) {
			await browser.tabs.remove(emptyTab.id);
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
	public async openBookmarkTab(tabBookmark:Bookmark, skipCreateEvent:boolean = true):Promise<Tab> {
		console.assert(tabBookmark && tabBookmark.parentId === this.bookmarkId);

		let data:TabData = TabData.createFromBookmark(tabBookmark);
		let createProperties = data.getTabCreateProperties();
		createProperties.active = true;
		createProperties.discarded = false;

		if(this.windowId) {
			createProperties.windowId = this.windowId;
		}

		if(skipCreateEvent) {
			this.ignoreNextCreatedTab = true;
		}
		let browserTab:Tab = await browser.tabs.create(createProperties);

		await this.addExistingTab(browserTab, tabBookmark.id);

		if(this.windowId) {
			// focus session window
			browser.windows.update(this.windowId, {
				focused: true
			});
		}

		return browserTab;
	}

	public async setTabAside(tabId:number):Promise<void> {
		if(this.tabs.delete(tabId)) {
			browser.tabs.remove(tabId);
		} else {
			return Promise.reject(new Error(`Tab ${tabId} is not part of this session.`));
		}
	}

	public async setTabsOrWindowAside():Promise<void> {
		this.removeEventListeners();

		if(this.tabs.size > 0) {
			if(this.windowId) {
				this.tabs = new Map();
				await browser.windows.remove(this.windowId);
			} else {
				let tabIds:number[] = this.getTabsIds();
				this.tabs = new Map();
				await browser.tabs.remove(tabIds);
			}
		}

		//TODO: prevent browser from closing
	}

	private async setAside() {
		return ActiveSessionManager.setAside(this.bookmarkId);
	}

	private async removeTabValues(tabId:number):Promise<void> {
		await Promise.all([
			browser.sessions.removeTabValue(tabId, "sessionID"),
			browser.sessions.removeTabValue(tabId, "bookmarkID")
		]);
	}

	/**
	 * Removes association from currently open tabs to this session.
	 */
	public async free():Promise<void> {
		this.removeEventListeners();

		// do not remove window when setAside() gets called
		this.windowId = null;

		// remove session/tab values
		await Promise.all(
			Array.from(this.tabs.keys()).map(
				tabId => this.removeTabValues(tabId)
			)
		);

		this.tabs = new Map();
	}

	public hasTab(tabId:number):boolean {
		return this.tabs.has(tabId);
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

	public static async reactivateWindow(sessionId:string, windowId:number):Promise<ActiveSession> {
		let bookmark:Bookmark = (await browser.bookmarks.get(sessionId))[0];
		let session:ActiveSession = new ActiveSession(bookmark);

		session.windowId = windowId;

		let tabs:Tab[] = await browser.tabs.query({windowId:windowId});

		await Promise.all(tabs.map(async tab => {
			let tabBookmarkId = (await browser.sessions.getTabValue(tab.id, "bookmarkID")) as string;
			session.tabs.set(tab.id, tabBookmarkId);
		}));

		session.setEventListeners();

		return session;
	}

	public static async reactivateTabs(sessionId:string, tabs:TabBookmark[]):Promise<ActiveSession> {
		let bookmark:Bookmark = (await browser.bookmarks.get(sessionId))[0];
		let session:ActiveSession = new ActiveSession(bookmark);

		tabs.forEach(x => session.tabs.set(x[0], x[1]));
		session.setEventListeners();

		return session;
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
		// the highlight API does not accept an empty array
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

	public start():void {
		if(this.tabCreatedListener) {
			throw new Error("Session is already active.");
		}

		// start tracking
		this.setEventListeners();
	}

	private async removeBookmarksFromQueue() {
		this.removeTimeoutId = 0;

		let bookmarks = this.bookmarkRemoveQueue;
		// clear queue
		this.bookmarkRemoveQueue = [];

		// remove bookmarks
		await Promise.all(
			bookmarks.map(
				tabBookmarkId => browser.bookmarks.remove(tabBookmarkId)
			)
		);

		// check if the session should be removed
		let tabBookmarks:Bookmark[] = await browser.bookmarks.getChildren(this.bookmarkId);

		if(tabBookmarks.length === 0) {
			ActiveSessionManager.removeSession(this.bookmarkId);
		} else {
			// update sidebar
			SessionContentUpdate.send(this.bookmarkId);
		}
	}

	private async setEventListeners() {
		let removeTabs:boolean = (await OptionsManager.getValue<string>("tabClosingBehavior")) === "remove-tab";

		// removed tabs
		this.tabRemovedListener = async (tabId, removeInfo) => {
			let tabBookmarkId:string = this.tabs.get(tabId);

			// check if tab is part of this session
			if(tabBookmarkId) {
				// remove tab
				this.tabs.delete(tabId);

				if(removeTabs) {
					if(this.removeTimeoutId > 0) {
						window.clearTimeout(this.removeTimeoutId);
					}
	
					// only remove tab from bookmarks after a timeout
					// to prevent the session from being removed when the window is closed
					// the delay may be removed when https://bugzilla.mozilla.org/show_bug.cgi?id=1399885 gets shipped
					this.bookmarkRemoveQueue.push(tabBookmarkId);
					this.removeTimeoutId = window.setTimeout(
						() => this.removeBookmarksFromQueue(),
						TAB_REMOVE_DELAY
					);
				}
			}
		};

		this.tabDetachedListener = async (tabId, removeInfo) => {
			let tabBookmarkId:string = this.tabs.get(tabId);

			// check if tab is part of this session
			if(tabBookmarkId) {
				// remove tab
				this.tabs.delete(tabId);

				// tab still exists -> remove tab values
				await this.removeTabValues(tabId);

				// remove associated bookmark
				await browser.bookmarks.remove(tabBookmarkId);

				// update sidebar
				SessionContentUpdate.send(this.bookmarkId);

				if(this.tabs.size === 0) {
					let tabBookmarks:Bookmark[] = await browser.bookmarks.getChildren(this.bookmarkId);

					if(tabBookmarks.length === 0) {
						ActiveSessionManager.removeSession(this.bookmarkId);
						return;
					} else {
						ActiveSessionManager.setAside(this.bookmarkId);
					}
				}
			}
		};

		// added tabs
		this.tabAttachedListener = async (tabId, attachInfo) => {
			if(attachInfo.newWindowId === this.windowId) {
				let tab:Tab = await browser.tabs.get(tabId);
				await this.addExistingTab(tab);

				// update sidebar
				SessionContentUpdate.send(this.bookmarkId);
			}
		};

		this.tabCreatedListener = async (tab) => {
			if(this.ignoreNextCreatedTab && tab.windowId === this.windowId) {
				this.ignoreNextCreatedTab = false;
				console.log("tab ignored");
				return;
			}

			/* determine if tab should be added to the session
			 * the tab should be added if:
			 * - tab is part of the sessions window (windowed mode)
			 * - tab was opened by/from a tab from this session
			*/
			let addToSession:boolean = tab.windowId === this.windowId
				|| (tab.hasOwnProperty("openerTabId") && this.tabs.has(tab.openerTabId));

			if(addToSession) {
				await this.addExistingTab(tab);

				// update sidebar
				SessionContentUpdate.send(this.bookmarkId);
			} else {
				console.log("tab not added");
			}
		};

		// modified tabs
		this.tabUpdatedListener = async (tabId, changeInfo, tab) => {
			let tabBookmarkId:string = this.tabs.get(tabId);

			// check if tab loaded & part of this session
			if(tabBookmarkId) {
				if(tab.status === "loading" && (Date.now() - this.sessionStartTime) < INITIAL_LOADING_TIMEOUT) {
					// ignore loading tabs
					return;
				}

				// only update session for certain changes
				let update:boolean = changeInfo.hasOwnProperty("url")
					|| changeInfo.hasOwnProperty("title")
					|| changeInfo.hasOwnProperty("mutedInfo")
					|| changeInfo.hasOwnProperty("pinned");

				if(update) {
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

		this.wndRemovedListener = async (windowId) => {
			if(this.windowId === windowId && this.bookmarkRemoveQueue.length > 1) {
				console.assert(this.removeTimeoutId > 0);

				// do not remove tabs, ...
				window.clearTimeout(this.removeTimeoutId);
				console.log("[TA] Prevented removal of session & tab bookmarks.");

				// ... just set the session aside
				this.setAside();
			}
		};

		// add event listeners
		browser.tabs.onCreated.addListener(this.tabCreatedListener);
		browser.tabs.onRemoved.addListener(this.tabRemovedListener);
		browser.tabs.onUpdated.addListener(this.tabUpdatedListener);
		if(this.windowId) {
			browser.tabs.onAttached.addListener(this.tabAttachedListener);
			browser.tabs.onDetached.addListener(this.tabDetachedListener);
			browser.windows.onRemoved.addListener(this.wndRemovedListener);
		}
	}

	private removeEventListeners() {
		browser.tabs.onCreated.removeListener(this.tabCreatedListener);
		browser.tabs.onRemoved.removeListener(this.tabRemovedListener);
		browser.tabs.onUpdated.removeListener(this.tabUpdatedListener);

		if(browser.tabs.onAttached.hasListener(this.tabAttachedListener)) {
			browser.tabs.onAttached.removeListener(this.tabAttachedListener);
			browser.tabs.onDetached.removeListener(this.tabDetachedListener);
			browser.windows.onRemoved.removeListener(this.wndRemovedListener);
		}
	}
}