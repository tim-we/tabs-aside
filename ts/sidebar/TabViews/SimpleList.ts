import TabView from "./TabView";

type Bookmark = browser.bookmarks.BookmarkTreeNode;

export default class SimpleList extends TabView {

    private list:HTMLOListElement = null;

    constructor(sessionId:string) {
        super(sessionId);
        
    }

    public createHTML(tabBookmarks:Bookmark[]): HTMLOListElement {
        let ol = document.createElement("ol");
        this.list = ol;

        tabBookmarks.forEach(tab => {
            let li:HTMLLIElement = document.createElement("li");

            let a:HTMLAnchorElement = document.createElement("a");
            a.classList.add("tab");
            a.textContent = tab.title;
            a.dataset.id = tab.id;
            a.href = tab.url;

            a.onclick = e => e.preventDefault();

            li.appendChild(a);
            ol.appendChild(li);
        });

        return this.list;
    }

    public update(tabBookmarks:Bookmark[]) {

    }
}