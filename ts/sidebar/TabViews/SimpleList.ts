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
		this.setTabCountClass(tabBookmarks.length);

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