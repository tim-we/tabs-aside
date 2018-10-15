import SessionView from "../SessionView";

type Bookmark = browser.bookmarks.BookmarkTreeNode;

export default abstract class TabView {
	protected sessionView:SessionView;

	constructor(session:SessionView) {
		this.sessionView = session;
	}

	public getSessionId():string {
		return this.sessionView.bookmarkId;
	}

	public abstract createHTML(tabBookmarks:Bookmark[]):HTMLElement;

	public abstract update(tabBookmarks:Bookmark[]):void;

}