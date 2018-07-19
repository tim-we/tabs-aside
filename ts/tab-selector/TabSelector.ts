import * as View from "./View";

export type Tab = browser.tabs.Tab;
export type SelectableTab = Tab & {selected?:boolean};
export type TabId = number;
type Tabs = Map<TabId, SelectableTab>;

let tabs:Tabs = new Map();

async function init() {
	await View.init();

	// get all browser tabs
	let browserTabs = await browser.tabs.query({});

	browserTabs.forEach(tab => {
		tabs.set(tab.id, tab);
		View.add(tab);
	});

	browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
		let oldTab = tabs.get(tabId);

		if(oldTab) {
			let selectableTab:SelectableTab = tab;
			selectableTab.selected = !!oldTab.selected;
			tabs.set(tabId, selectableTab);

			View.update(selectableTab);
		}
	});

	browser.tabs.onCreated.addListener(tab => {
		tabs.set(tab.id, tab);
		View.add(tab);
	});

	browser.tabs.onRemoved.addListener(tabId => {
		let tab = tabs.get(tabId);

		if(tab) {
			tabs.delete(tabId);
			View.remove(tab);
		}
	});
}

export function toggleTab(tabId:TabId, updateView:boolean = false):boolean {
	let tab:SelectableTab = tabs.get(tabId);
	tab.selected = !tab.selected;

	if(updateView) {
		View.update(tab);
	}

	return tab.selected;
}

export function selectAll():void {
	tabs.forEach(tab => {
		if(!tab.selected) {
			tab.selected = true;
			View.update(tab);
		}
	});
}

export function unSelectAll():void {
	tabs.forEach(tab => {
		if(tab.selected) {
			tab.selected = false;
			View.update(tab);
		}
	});
}

export function invertSelection():void {
	tabs.forEach(tab => {
		tab.selected = !tab.selected;
		View.update(tab);
	});
}

init();
