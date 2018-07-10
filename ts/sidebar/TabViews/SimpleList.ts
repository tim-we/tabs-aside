import TabView from "./TabView";
import TabData from "../../core/TabData";

type Bookmark = browser.bookmarks.BookmarkTreeNode;

export default class SimpleList extends TabView {

	private list:HTMLOListElement = null;

	constructor(sessionId:string) {
		super(sessionId);
		
	}

	public createHTML(tabBookmarks:Bookmark[]): HTMLOListElement {
		let ol = document.createElement("ol");
		this.list = ol;
		this.setTabCountClass(tabBookmarks.length);

		tabBookmarks.forEach(bm => {
			let data:TabData = TabData.createFromBookmark(bm);

			let li:HTMLLIElement = document.createElement("li");

			let a:HTMLAnchorElement = document.createElement("a");
			a.classList.add("tab");
			a.textContent = data.title;
			a.dataset.id = bm.id;
			a.href = data.url;

			a.onclick = e => e.preventDefault();

			li.appendChild(a);
			ol.appendChild(li);
		});

		return this.list;
	}

	private setTabCountClass(n:number):void {
		if(n >= 10 && n < 100) {
			this.list.classList.add("geq10");
			this.list.classList.remove("geq100");
		} else if(n >= 100) {
			this.list.classList.add("geq100");
		} else {
			this.list.classList.remove("geq10");
			this.list.classList.remove("geq100");
		}
	}

	public update(tabBookmarks:Bookmark[]) {

	}
}