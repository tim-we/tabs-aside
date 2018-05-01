export class Tab {
	public id:number;
	public pinned:boolean = false;
	public bookmarkId:string|null = null;

	constructor(id:number, bookmarkId?:string) {
		this.id = id;
		if(bookmarkId) {
			this.bookmarkId = bookmarkId;
		}
	}

	public static createFromBrowserTab(tab:browser.tabs.Tab):Tab {
		if(tab.id) {
			let t:Tab = new Tab(tab.id);

			return t;
		} else {
			throw new Error("That tab has no id.");
		}
	}
}