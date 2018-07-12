/**
 * This code should only be executed as part of the background script.
 */

import TabData from "./TabData";

interface TabCreateProperties {
	active?:boolean,
	url:string
}

type Tab = browser.tabs.Tab;

const TAB_LOADER_BASE_URL = browser.extension.getURL("tab-loader/load.html");

// maps tab ids to their actual URL
let tabURLs:Map<number, string> = new Map();

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

export async function create(tab:TabData):Promise<Tab> {
	let createProperties:TabCreateProperties = tab.getTabCreateProperties();

	// modify create properties
	createProperties.active = false;
	createProperties.url = getTabLoaderURL(tab.url, tab.title);

	// create unloaded tab
	let browserTab:Tab = await browser.tabs.create(createProperties);
	
	// store the actual URL in @{tabURLs}
	// and as a tab value (sessions API) to allow extension reload
	tabURLs.set(browserTab.id, tab.url);
	await browser.sessions.setTabValue(browserTab.id, "loadURL", tab.url);

	return browserTab;
}

function getTabLoaderURL(url:string, title:string):string {
	return TAB_LOADER_BASE_URL + "?" + [
		`url=${encodeURIComponent(url)}`,
		`title=${encodeURIComponent(title)}`
	].join("&");
}

async function handleTabActivated(activeInfo:{tabId:number, windowId:number}) {
	let tabId:number = activeInfo.tabId;

	let url:string = tabURLs.get(tabId);

	// this is the check if the tab is one of the unloaded ones
	if(url) {
		await Promise.all([
			// remove session value
			browser.sessions.removeTabValue(tabId, "loadURL"),

			// load tab
			browser.tabs.update(tabId, { url: url, loadReplace: true })
		]);
		
		tabURLs.delete(tabId);
	}
}

function handleTabRemoved(tabId:number, removeInfo:object) {
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
				// store in the map for quick synchronous access
				tabURLs.set(tab.id, loadURL);
			}
		}
	}
}