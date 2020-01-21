export type SessionId = string;
export type Tab = browser.tabs.Tab;
export type Window = browser.windows.Window;
export type Bookmark = browser.bookmarks.BookmarkTreeNode;

export type TabCreateProperties = {
	active?:boolean;
	url?: string;
	pinned?:boolean;
	openInReaderMode?:boolean;
	windowId?:number;
	discarded?: boolean;
	cookieStoreId?: string;
};

export type BookmarkCreateDetails = browser.bookmarks.CreateDetails;

export type BookmarkChanges = {title?:string; url?:string};

export type TabCreatedListener = (tab:Tab) => void;

export type TabRemoveListener = (
	tabId:number, removeInfo:{
		windowId:number,
		isWindowClosing:boolean
}) => void;

export type TabUpdatedListener = (
	tabId:number,
	changeInfo:TabChangeInfo,
	tab:Tab
) => void;

type TabChangeInfo = {
	isArticle?:boolean,
	mutedInfo?:browser.tabs.MutedInfo,
	pinned?:boolean,
	status?: "loading"|"complete",
	title?:string,
	url?:string;
};

export type TabAttachedListener = (
	tabId:number,
	attachInfo:{
		newWindowId:number,
		newPosition:number
	}
) => void;

export type TabDetachedListener = (
	tabId:number,
	detachInfo:{
		oldWindowId:number,
		oldPosition:number
	}
) => void;

export type WindowRemovedListener = (windowId:number) => void;

export type ContextMenuId = string | number;