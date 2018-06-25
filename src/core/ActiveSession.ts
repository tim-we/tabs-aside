import { UnloadedTabs } from "./UnloadedTabs";

export default class ActiveSession {
	public bookmarkId:string;
	public windowId:number;

	// maps tab ids to their respective bookmark ids
	private tabBookmarkAssociation:Map<number, string> = new Map<number, string>();
	
	private unloadedTabs:UnloadedTabs = new UnloadedTabs();

	constructor(bookmarkId:string, windowId:number = browser.windows.WINDOW_ID_NONE) {
		this.bookmarkId = bookmarkId;
		this.windowId = windowId;
		this.unloadedTabs;

		// register tab listeners:

		this.unloadedTabs.addTabActivationListener(tabId => {
			// tab was just loaded, add to tracked tabs
			browser.sessions.getTabValue(tabId, "bookmarkId")
			.then(x => {
				this.tabBookmarkAssociation.set(tabId, x as string);
			});
		});

		browser.tabs.onUpdated.addListener(
			(tabID, changeInfo, tab) => this.tabUpdateListener(tabID, changeInfo, tab)
		);

		browser.tabs.onRemoved.addListener(
			tabId => this.tabRemovedListener(tabId)
		);
	}

	public getId():string {
		return this.bookmarkId;
	}

	private getTabBookmarks():Promise<browser.bookmarks.BookmarkTreeNode[]> {
		return browser.bookmarks.getChildren(this.bookmarkId)
			// just bookmarks that have a URL property (no folders)
			.then(bms => bms.filter(bm => bm.url));
	}

	public getTabIds():number[] {
		return Array.from(this.tabBookmarkAssociation.keys())
			.concat(this.unloadedTabs.getTabIds());
	}

	public openAll():Promise<void> {
		return this.getTabBookmarks().then(bms => {
			// create tabs (the promise resolves when every tab has been successfully created)
			return Promise.all(
				bms.map(
					bm => this.createTab(bm).then(tab => {
						// use the browsers sessions API
						// (these values will be kept even if the extension stops running)
						return Promise.all([
							browser.sessions.setTabValue(tab.id as number, "sessionId", this.bookmarkId),
							browser.sessions.setTabValue(tab.id as number, "bookmarkId", bm.id)
						]);
					})
				)
			);
		}).then(_ => {
			console.log(`[TA] Session ${this.bookmarkId} restored.`);
		}, reason => {
			console.error(`[TA] Error restoring session ${this.bookmarkId}.`);
			console.error(`[TA] Reason:\n${reason}`);

			// let the caller know something went wrong
			return Promise.reject(reason);
		});
	}

	private createTab(bm:browser.bookmarks.BookmarkTreeNode):Promise<browser.tabs.Tab> {
		let loadTabsOnActivation:boolean = true;

		// TODO
		let createProperties = {
			pinned: false,
			url: bm.url as string,
			windowId: this.windowId
		}

		if(loadTabsOnActivation) {
			return this.unloadedTabs.create(createProperties, bm.title);
		} else {
			return browser.tabs.create(createProperties).then(tab => {
				this.tabBookmarkAssociation.set(tab.id as number, bm.id);

				return tab;
			});
		}
	}

	private tabUpdateListener(tabId:number, changeInfo:object, tab:browser.tabs.Tab):void {
		let bmId = this.tabBookmarkAssociation.get(tabId);

		if(bmId) {

		}
	}

	private tabRemovedListener(tabId:number):void {
		let bmId = this.tabBookmarkAssociation.get(tabId);

		if(bmId) {

		}
	}
}