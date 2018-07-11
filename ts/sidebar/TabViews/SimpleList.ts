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

		tabBookmarks.forEach(
			bm => ol.appendChild(this.createTabView(bm))
		);

		return this.list;
	}

	private createTabView(tabBookmark:Bookmark):HTMLLIElement {
		let data:TabData = TabData.createFromBookmark(tabBookmark);

		let li:HTMLLIElement = document.createElement("li");

		let a:HTMLAnchorElement = document.createElement("a");
		a.classList.add("tab");
		a.textContent = data.title;
		a.dataset.id = tabBookmark.id;
		a.href = data.url;
		a.title = data.getHostname();
		a.onclick = e => {
			e.preventDefault();

			// temporary
			browser.tabs.create(data.getTabCreateProperties());
		};

		if(data.isInReaderMode) {
			li.appendChild(this.createStateIcon("rm"));
		}

		if(data.pinned) {
			li.appendChild(this.createStateIcon("pinned"));
		}

		li.appendChild(a);

		return li;
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
		// TODO
	}

	private createStateIcon(type:"pinned"|"rm"):HTMLElement {
		let icon = document.createElement("span");
		icon.classList.add("state-icon");
		icon.classList.add(type);

		return icon;
	}
}