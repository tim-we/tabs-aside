import TabData from "./TabData";
import * as OptionsManager from "../options/OptionsManager";
import FuncIterator from "../util/FuncIterator";
import { Tab, Bookmark, Window } from "../util/CommonTypes";

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

		return activeSession;
	}

	/**
	 * Creates an active session and restores all tabs.
	 * @param sessionId The bookmark id of the session to be restored
	 */
	public static async restoreAll(sessionId:string):Promise<ActiveSession> {
		// get session bookmark & children
		let sessionBookmark:Bookmark = (await browser.bookmarks.getSubTree(sessionId))[0];
		console.assert(sessionBookmark && sessionBookmark.children.length > 0);

		return await ActiveSession.restore(sessionBookmark);
	}

	/**
	 * Creates an active session but restores only a single tab.
	 * @param tabBookmark The bookmark of the tab to restore
	 */
	public static async restoreSingleTab(tabBookmark:Bookmark):Promise<ActiveSession> {
		// parent bookmark = session bookmark
		let sessionId:string = tabBookmark.parentId;
		let sessionBookmark:Bookmark = (await browser.bookmarks.get(sessionId))[0];

		return await ActiveSession.restore(sessionBookmark, tabBookmark);
	}

	/**
	 * Adds an existing tab to the active session.
	 * This method does not create a bookmark for the given tab, instead it
	 * sets tab values (sessions API) and stores tab in the local data structure.
	 * @param tab a browser tab
	 * @param tabBookmarkId the id of the bookmark representing this tab
	 */
	public async addExistingTab(tab:Tab, tabBookmarkId:string):Promise<void> {
		// store session info via the sessions API
		await Promise.all([
			browser.sessions.setTabValue(tab.id, "sessionID", this.bookmarkId),
			browser.sessions.setTabValue(tab.id, "bookmarkID", tabBookmarkId)
		]);

		this.tabs.set(tab.id, tabBookmarkId);
	}

	/**
	 * Open a tab from a bookmark and add it to this session
	 * @param tabBookmark a bookmark from this session
	 */
	public async openBookmarkTab(tabBookmark:Bookmark):Promise<Tab> {
		console.assert(tabBookmark && tabBookmark.parentId === this.bookmarkId);

		let data:TabData = TabData.createFromBookmark(tabBookmark);
		let createProperties = data.getTabCreateProperties();

		if(this.windowId) {
			createProperties.windowId = this.windowId;
		}

		let browserTab:Tab = await browser.tabs.create(createProperties);

		this.addExistingTab(browserTab, tabBookmark.id);

		return browserTab;
	}

	public async setAside():Promise<void> {
		//TODO: remove event listeners

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
		await browser.tabs.highlight({
			tabs: this.getTabsIds()
		});
	}
}