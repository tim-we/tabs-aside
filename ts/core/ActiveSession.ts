import TabData from "./TabData";
import * as UnloadedTabs from "./UnloadedTabs";
import * as OptionsManager from "../options/OptionsManager";
import FuncIterator from "../util/FuncIterator";

type Tab = browser.tabs.Tab;
type Window = browser.windows.Window;
type Bookmark = browser.bookmarks.BookmarkTreeNode;

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
	private unloadedTabs:Set<number> = new Set();

	private constructor(sessionId:string, title?:string) {
		this.bookmarkId = sessionId;
		this.title = title;
	}

	public static async restoreAll(sessionId:string):Promise<ActiveSession> {
		// get session bookmark & children
		let sessionData:Bookmark = (await browser.bookmarks.getSubTree(sessionId))[0];
		console.assert(sessionData && sessionData.children.length > 0);

		// create ActiveSession instance
		let activeSession:ActiveSession = new ActiveSession(sessionId, sessionData.title);

		let windowedSession:boolean = await OptionsManager.getValue<boolean>("windowedSession");
		let emptyTab:Tab = null;

		if(windowedSession) {
			// create session window
			let wnd:Window = await createWindow(sessionData.title);
			activeSession.windowId = wnd.id;
			emptyTab = wnd.tabs[0];
			await browser.sessions.setWindowValue(wnd.id, "sessionID", sessionId);
		}

		let load:boolean = !(await OptionsManager.getValue<boolean>("smartTabLoading"));

		// add tabs
		await Promise.all(
			sessionData.children.map(
				tabBookmark => {
					activeSession.addTab(tabBookmark, load);
				}
			)
		);

		// new window contains a "newtab" tab
		// -> close it after sessions tabs are restored
		if(emptyTab) {
			browser.tabs.remove(emptyTab.id);
		}

		return activeSession;
	}

	public static async createFromTabs(tabs:Tab[], title:string, windowsId?:number):Promise<ActiveSession> {
		// check if there are any tabs to create a session from
		if(tabs.length === 0) {
			throw new Error("No tabs to create a session from. Sessions cannot be empty.");
		}

		// create bookmark folder
		let folder:Bookmark = await browser.bookmarks.create({
			parentId: await OptionsManager.getValue<string>("rootFolder"),
			title: title
		});

		// ActiveSession instance
		let session:ActiveSession = new ActiveSession(folder.id, title);

		// setup tabs
		await Promise.all(
			tabs.map(
				async tab => {
					let data:TabData = TabData.createFromTab(tab);

					// create a bookmark for the tab
					let bm:Bookmark = await browser.bookmarks.create(
						data.getBookmarkCreateDetails(session.bookmarkId)
					);

					await session.setupTab(tab, bm.id);
				}
			)
		);

		return session;
	}

	public static async restoreSingleTab(tabBookmark:Bookmark):Promise<ActiveSession> {
		let sessionId:string = tabBookmark.parentId;
		let sessionBookmark:Bookmark = (await browser.bookmarks.get(sessionId))[0];
		let activeSession:ActiveSession = new ActiveSession(sessionId, sessionBookmark.title);

		let emptyTab:Tab = null;

		if(await OptionsManager.getValue<boolean>("windowedSession")) {
			let sessionBookmark:Bookmark = (await browser.bookmarks.get(sessionId))[0];

			// create session window
			let wnd:Window = await createWindow(sessionBookmark.title);
			activeSession.windowId = wnd.id;
			// new window contains a "newtab" tab
			emptyTab = wnd.tabs[0];
		}

		activeSession.addTab(tabBookmark);

		if(emptyTab) {
			// close "newtab" tab after sessions tabs are restored
			browser.tabs.remove(emptyTab.id);
		}

		return activeSession;
	}

	/**
	 * Sets tab values (sessions API) and stores tab in the local data structure
	 * @param tab a browser tab
	 * @param tabBookmarkId the id of the bookmark representing this tab
	 */
	private async setupTab(tab:Tab, tabBookmarkId:string):Promise<void> {
		// store session info via the sessions API
		await Promise.all([
			browser.sessions.setTabValue(tab.id, "sessionID", this.bookmarkId),
			browser.sessions.setTabValue(tab.id, "bookmarkID", tabBookmarkId)
		]);

		this.tabs.set(tab.id, tabBookmarkId);
	}

	private async addTab(tabBookmark:Bookmark, load:boolean = true):Promise<Tab> {
		let data:TabData = TabData.createFromBookmark(tabBookmark);
		let createProperties = data.getTabCreateProperties();

		if(this.windowId) {
			createProperties.windowId = this.windowId;
		}

		if(createProperties.openInReaderMode) {
			// tab loader does not currently support reader mode
			// since tabs.toggleReaderMode() does not work while
			// the tab is still loading :(
			load = true;
		}

		let browserTab:Tab = await (load ?
			browser.tabs.create(createProperties) :
			UnloadedTabs.create(createProperties, data)
		);

		this.setupTab(browserTab, tabBookmark.id);

		return browserTab;
	}

	public async openSingleTab(tabBookmark:Bookmark):Promise<void> {
		console.assert(tabBookmark && tabBookmark.parentId === this.bookmarkId);

		await this.addTab(tabBookmark);
	}

	public async setAside():Promise<void> {
		//TODO: remove event listeners

		if(this.windowId) {
			this.tabs = new Map();
			this.unloadedTabs = new Set();
			await browser.windows.remove(this.windowId);
		} else {
			await browser.tabs.remove(this.getTabsIds());
		}
	}

	private getTabsIds():number[] {
		let fi:FuncIterator<number> = new FuncIterator(this.tabs.keys());
		return fi.append(this.unloadedTabs.values()).toArray();
	}

	public getData():ActiveSessionData {
		return {
			bookmarkId: this.bookmarkId,
			title: this.title,
			windowId: this.windowId,
			tabs: this.getTabsIds()
		};
	}
}

function createWindow(sessionTitle?:string):Promise<Window> {
	let prefix:string = sessionTitle + " | ";
	
	return browser.windows.create(
		sessionTitle ? {titlePreface: prefix} : {}
	);
}