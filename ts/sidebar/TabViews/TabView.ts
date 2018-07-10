type Bookmark = browser.bookmarks.BookmarkTreeNode;

export default abstract class TabView {
	protected bookmarkId:string;

	constructor(sessionId:string) {
		this.bookmarkId = sessionId;
	}

	public abstract createHTML(tabBookmarks:Bookmark[]):HTMLElement;

	public abstract update(tabBookmarks:Bookmark[]):void;

}