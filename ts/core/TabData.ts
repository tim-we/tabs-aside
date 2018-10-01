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
	discarded?: boolean;
};
type BookmarkCreateDetails = browser.bookmarks.CreateDetails;

/**
 * Regular expression that parses tab options and title from a bookmark title.
 * Example bookmark title: "[pinned,rm] Actual title"
 */
const bmTitleParser:RegExp = /^(\[(rm,|pinned,|src)*(rm|pinned|src)?\]\s)?(.*)$/;
const validURL:RegExp = /^https?:\/\//i;

const readerPrefix:string = "about:reader?url=";
const viewSourcePrefix:string = "view-source:";

export default class TabData {
	public readonly pinned:boolean;
	public readonly isInReaderMode:boolean;
	public readonly title:string;
	public readonly url:string;
	public readonly favIconUrl:string;
	public readonly viewSource:boolean;

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
			pinned: this.pinned,
			discarded: !this.pinned // Pinned tabs cannot be created and discarded.
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
		return !validURL.test(this.url);
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
			this.viewSource = tab.url.startsWith(viewSourcePrefix);
			
			if(tab.isInReaderMode) {
				this.isInReaderMode = true;
				// URL format
				// "about:reader?url=https%3A%2F%2Fexample.com%2Freader-compatible-page"
				this.url = decodeURIComponent(
					tab.url.substr(readerPrefix.length)
				);
			} else {
				this.isInReaderMode = false;
			}

			if(this.viewSource) {
				this.url = this.url.substr(viewSourcePrefix.length);
			}
		} else if(bookmark) { // create from bookmark
			let data:TitleData = this.decodeTitle(bookmark.title);

			this.url = bookmark.url;
			this.title = data.title;
			this.pinned = data.options.has("pinned");
			this.isInReaderMode = data.options.has("rm");
			this.viewSource = data.options.has("src");

			// guess the favicon path
			this.favIconUrl = (new URL(bookmark.url)).origin + "/favicon.ico";
			// alternative:
			// link.href = "http://s2.googleusercontent.com/s2/favicons?domain=" + url.hostname;

			if(this.viewSource) {
				this.url = viewSourcePrefix + this.url;
			}
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

		if(this.viewSource) {
			tabOptions.push("src");
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