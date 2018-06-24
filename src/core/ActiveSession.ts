import { Tab } from "./Tab";
import { UnloadedTabs } from "./UnloadedTabs";

export default class ActiveSession {
	public bookmarkId:string;
	private tabs:Tab[] = [];
	public windowId:number;
	private unloadedTabs:UnloadedTabs = new UnloadedTabs();

	constructor(bookmarkId:string, windowId:number = browser.windows.WINDOW_ID_NONE) {
		this.bookmarkId = bookmarkId;
		this.windowId = windowId;
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
		return this.tabs.map(tab => tab.id).concat(this.unloadedTabs.getTabIds());
	}

	public openAll():Promise<void> {
		return this.getTabBookmarks().then(bms => {
			// create tabs (the promise resolves when every tab has been successfully created)
			return Promise.all(
				bms.map(
					bm => this.unloadedTabs.create(
						_createProperties(bm, this.windowId)
					).then(tab => {
						// use the browsers sessions API
						// (these values will be kept even if the extension stops running)
						return Promise.all([
							browser.sessions.setTabValue(tab.id as number, "sessionID", this.bookmarkId),
							browser.sessions.setTabValue(tab.id as number, "bookmarkID", bm.id)
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
}

// temporary
function _createProperties(bm:browser.bookmarks.BookmarkTreeNode, windowId:number) {
	return {
		pinned: false,
		url: bm.url as string,
		windowId: windowId
	};
}