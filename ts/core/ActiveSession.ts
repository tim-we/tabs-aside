import TabData from "./TabData";
import * as OptionsManager from "../options/OptionsManager";

type Tab = browser.tabs.Tab;
type Window = browser.windows.Window;
type Bookmark = browser.bookmarks.BookmarkTreeNode;

export default class ActiveSession {
	public readonly bookmarkId:string;
	public windowId:number;
	
	// maps tab ids to bookmark ids
	private tabs:Map<number, string> = new Map();
	private unloadedTabs:Set<number> = new Set();

	private constructor(sessionId:string, tabBookmarkId?:string) {
		this.bookmarkId = sessionId;
	}

	public static async restoreAll(sessionId:string):Promise<ActiveSession> {
		let activeSession:ActiveSession = new ActiveSession(sessionId);

		let sessionData:Bookmark = (await browser.bookmarks.getSubTree(sessionId))[0];
		console.assert(sessionData && sessionData.children.length > 0);

		if(await OptionsManager.getValue<boolean>("windowedSession")) {
			// create session window
			let wnd:Window = await createWindow(sessionData.title);
			activeSession.windowId = wnd.id;
		}

		// add tabs
		await Promise.all(
			sessionData.children.map(
				tabBookmark => {
					activeSession.addTab(tabBookmark);
				}
			)
		);

		return activeSession;
	}

	public static async restoreSingleTab(tabBookmarkId:string):Promise<ActiveSession> {
		let bm:Bookmark = (await browser.bookmarks.get(tabBookmarkId))[0];
		console.assert(bm);

		let sessionId:string = bm.parentId;
		let activeSession:ActiveSession = new ActiveSession(sessionId);

		if(await OptionsManager.getValue<boolean>("windowedSession")) {
			let sessionBookmark:Bookmark = (await browser.bookmarks.get(sessionId))[0];

			// create session window
			let wnd:Window = await createWindow(sessionBookmark.title);
			activeSession.windowId = wnd.id;
		}

		activeSession.addTab(bm);

		return activeSession;
	}

	private async addTab(tabBookmark:Bookmark):Promise<Tab> {
		let data:TabData = TabData.createFromBookmark(tabBookmark);
		let createProperties = data.getTabCreateProperties();

		if(this.windowId) {
			createProperties.windowId = this.windowId;
		}

		let browserTab:Tab = await browser.tabs.create(createProperties);

		this.tabs.set(browserTab.id, tabBookmark.id);

		return browserTab;
	}

	public async openSingleTab(tabBookmarkId:string):Promise<void> {
		let bm:Bookmark = (await browser.bookmarks.get(tabBookmarkId))[0];

		console.assert(bm && bm.parentId === this.bookmarkId);

		await this.addTab(bm);
	}
}

function createWindow(sessionTitle?:string):Promise<Window> {
	return browser.windows.create(
		sessionTitle ? {titlePreface: sessionTitle} : {}
	);
}