/**
 * This code should only be executed as part of the background script.
 */

import TabData from "./TabData";

type TabCreateProperties = {
	active?:boolean;
	openInReaderMode?:boolean;
	url:string;
};

type TabUpdateProperties = {
	active?:boolean;
	url?:string;
	loadReplace?:boolean;
	muted?:boolean;
	pinned?:boolean;
}

type Tab = browser.tabs.Tab;
type TabId = number;
type Bookmark = browser.bookmarks.BookmarkTreeNode;

const TAB_LOADER_BASE_URL = browser.extension.getURL("html/tab-loader.html");

// maps tab ids to their actual URL
let tabURLs:Map<TabId, TabData> = new Map();

export async function init() {
	browser.tabs.onActivated.addListener(handleTabActivated);
	browser.tabs.onRemoved.addListener(handleTabRemoved);

	// search for unknown unloaded tabs
	searchTabsForUnloadedTabs(
		await browser.tabs.query({lastFocusedWindow:true})
	);
	searchTabsForUnloadedTabs(
		await browser.tabs.query({lastFocusedWindow:false})
	);
}

export async function create(createProperties:TabCreateProperties, tab:TabData):Promise<Tab> {
	// modify create properties
	createProperties.active = false;
	createProperties.url = getTabLoaderURL(tab.url, tab.title);

	// create unloaded tab
	let browserTab:Tab = await browser.tabs.create(createProperties);
	
	// store tab data and as a tab value (sessions API)
	// to handle extension/browser crashes or reloads
	tabURLs.set(browserTab.id, tab);
	await browser.sessions.setTabValue(browserTab.id, "loadURL", tab.url);

	return browserTab;
}

function getTabLoaderURL(url:string, title:string):string {
	return TAB_LOADER_BASE_URL + "?" + [
		`url=${encodeURIComponent(url)}`,
		`title=${encodeURIComponent(title)}`
	].join("&");
}

async function handleTabActivated(activeInfo:{tabId:TabId, windowId:number}) {
	let tabId:number = activeInfo.tabId;

	let tab:TabData = tabURLs.get(tabId);

	// check if the tab is one of the unloaded ones
	if(tab) {
		// load tab
		await browser.tabs.update(tabId, { url: tab.url, loadReplace: true });

		// clear bookkeeping
		tabURLs.delete(tabId);
		await browser.sessions.removeTabValue(tabId, "loadURL");
	}
}

function handleTabRemoved(tabId:TabId, removeInfo:object) {
	tabURLs.delete(tabId);
}

/**
 * Searches given tabs for unloaded tabs that have no entry in {@code tabURLs}
 * @param tabs array of browser tabs
 */
async function searchTabsForUnloadedTabs(tabs:Tab[]) {
	for(let i=0; i<tabs.length; i++) {
		let tab:Tab = tabs[i];

		if(!tabURLs.has(tab.id) && tab.url.startsWith(TAB_LOADER_BASE_URL)) {
			let loadURL:string = (await browser.sessions.getTabValue(tab.id, "loadURL")) as string;

			// check if the tab is an unloaded tab (loadURL value set)
			if(loadURL) {
				// get the tabs bookmark id
				let bookmarkId:string = (await browser.sessions.getTabValue(tab.id, "bookmarkID")) as string;
				
				if(bookmarkId) {
					let bookmark:Bookmark = (await browser.bookmarks.get(bookmarkId))[0];

					let data:TabData = TabData.createFromBookmark(bookmark);

					// store in the map for quick synchronous access
					tabURLs.set(tab.id, data);
				}
			}
		}
	}
}