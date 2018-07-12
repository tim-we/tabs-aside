type Tab = browser.tabs.Tab;
type Bookmark = browser.bookmarks.BookmarkTreeNode;
type TitleData = {
	title:string,
	options:Set<string>
};
type TabCreateProperties = {
	url: string;
	pinned?:boolean;
	openInReaderMode?:boolean;
	windowId?:number;
};
type BookmarkCreateDetails = browser.bookmarks.CreateDetails;

/**
 * Regular expression that parses tab options and title from a bookmark title.
 * Example bookmark title: "[pinned,rm] Actual title"
 */
const bmTitleParser:RegExp = /^(\[(rm,|pinned,)*(rm|pinned)?\]\s)?(.*)$/;
const validURL:RegExp = /^(https?:|view-source:)/i;
const readerPrefix:string = "about:reader?url=";

export default class TabData {
	public readonly pinned:boolean;
	public readonly isInReaderMode:boolean;
	public readonly title:string;
	public readonly url:string;
	public readonly favIconUrl:string;

	public static createFromTab(tab:Tab):TabData {
		return new TabData(tab, null);
	}

	public static createFromBookmark(bookmark:Bookmark):TabData {
		return new TabData(null, bookmark);
	}

	public getTabCreateProperties():TabCreateProperties {
		let createProperties:TabCreateProperties = {
			url: this.url,
			openInReaderMode: this.isInReaderMode,
			pinned: this.pinned
		};
		
		return createProperties;
	}

	public getBookmarkCreateDetails(parentId:string):BookmarkCreateDetails {
		return {
			parentId: parentId,
			title: this.encodeTitle(),
			url: this.url
		};
	}

	public isPrivileged():boolean {
		return validURL.test(this.url);
	}

	public getHostname():string {
		return (new URL(this.url)).hostname;
	}

	private constructor(tab:Tab, bookmark:Bookmark) {
		if(tab) { // create from tab
			this.pinned = tab.pinned;
			this.title = tab.title;
			this.url = tab.url;
			this.favIconUrl = tab.favIconUrl;
			
			if(tab.isInReaderMode) {
				this.isInReaderMode = true;
				// URL format (example by ingvar-lynn)
				// "about:reader?url=https%3A%2F%2Fwww.ualberta.ca%2Fmedicine%2Fnews%2F2018%2Fjune%2Fputting-the-brakes-on-metastatic-cancer"
				this.url = decodeURIComponent(
					tab.url.substr(readerPrefix.length)
				);
			} else {
				this.isInReaderMode = false;
			}
		} else if(bookmark) { // create from bookmark
			let data:TitleData = this.decodeTitle(bookmark.title);

			this.url = bookmark.url;
			this.title = data.title;
			this.pinned = data.options.has("pinned");
			this.isInReaderMode = data.options.has("rm");

			// guess the favicon path
			this.favIconUrl = (new URL(bookmark.url)).origin + "/favicon.ico";
		}

		if(this.title.trim() === "") {
			this.title = this.getHostname();
		}
	}

	private encodeTitle():string {
		let tabOptions:string[] = [];

		if(this.isInReaderMode) {
			tabOptions.push("rm");
		}

		if(this.pinned) {
			tabOptions.push("pinned");
		}

		let prefix:string = (tabOptions.length > 0) ? 
			`[${tabOptions.join(",")}] ` : "";

		return prefix + this.title;;
	}

	private decodeTitle(title:string):TitleData {
		let matches:string[] = title.match(bmTitleParser);

		let data:string = matches[1] || "";
		let options:Set<string> = new Set<string>(
			data.substring(1, data.length - 2).split(",")
		);

		return {
			title: matches[matches.length - 1],
			options: options
		};
	}
}