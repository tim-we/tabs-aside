export type SessionId = string;
export type Tab = browser.tabs.Tab;
export type Window = browser.windows.Window;
export type Bookmark = browser.bookmarks.BookmarkTreeNode;

export type TabCreateProperties = {
	url: string;
	pinned?:boolean;
	openInReaderMode?:boolean;
	windowId?:number;
	discarded?: boolean;
};

export type BookmarkCreateDetails = browser.bookmarks.CreateDetails;