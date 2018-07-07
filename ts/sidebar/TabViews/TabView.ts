export default abstract class TabView {
    private bookmarkId:string;

    constructor(bookmarkId:string) {
        this.bookmarkId = bookmarkId;
    }

    public getSessionTabs():Promise<browser.bookmarks.BookmarkTreeNode[]> {
        return browser.bookmarks.getChildren(this.bookmarkId)
    }

}