import { Tab } from "./Tab";

export class Session {
	public bookmarkId:string;
	public tabs:Tab[] = [];
	public windowId:number = browser.windows.WINDOW_ID_NONE;

	constructor(bookmarkId:string) {
		this.bookmarkId = bookmarkId;
	}

	public getId():string {
		return this.bookmarkId;
	}
}