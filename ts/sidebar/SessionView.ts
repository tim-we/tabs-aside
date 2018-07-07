import * as TabViewFactory from "./TabViewFactory";

export default class SessionView {
    public bookmarkId:string;

    private html:HTMLElement;

    private titleElement:HTMLElement;

    constructor(bookmark:browser.bookmarks.BookmarkTreeNode) {
        this.bookmarkId = bookmark.id;

        this.createHTML(bookmark);
    }

    public getHTML() {
        return this.html;
    }

    public async updateHTML() {
        let sessionBookmark:browser.bookmarks.BookmarkTreeNode = (await browser.bookmarks.getSubTree(this.bookmarkId))[0];
        this.titleElement.innerText = sessionBookmark.title;

    }

    private createHTML(bookmark:browser.bookmarks.BookmarkTreeNode) {
        this.html = document.createElement("div");
        this.html.classList.add("session");

        this.titleElement = document.createElement("div");
        this.titleElement.innerText = bookmark.title;

        this.html.appendChild(this.titleElement);
    }

    public toggle() {
        if(this.isExpanded()) {
            this.collapse();
        } else {
            this.expand();
        }
    }

    public isExpanded() {
        return this.html.classList.contains("expanded");
    }

    public expand() {
        let tabView = TabViewFactory.createTabView(this.bookmarkId);
    }

    public collapse() {

    }
}