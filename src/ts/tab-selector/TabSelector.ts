import * as View from "./View.js";
import FuncIterator from "../util/FuncIterator.js";
import { ActiveSessionData } from "../core/ActiveSession.js";
import { DataRequest, SessionEvent } from "../messages/Messages.js";
import * as MessageListener from "../messages/MessageListener.js";

export type Tab = browser.tabs.Tab;
export type SelectableTab = Tab & {selected?:boolean};
export type TabId = number;
type Tabs = Map<TabId, SelectableTab>;

let tabs:Tabs = new Map();

async function init() {
	await View.init();

	// get all browser tabs
	let browserTabs = await browser.tabs.query({});
	let currentTab:Tab = await browser.tabs.getCurrent();

	// get tabs to ignore
	let activeSessions:ActiveSessionData[] = await DataRequest.send<ActiveSessionData[]>("active-sessions");
	
	let tabsInSession:Set<TabId> = new Set();

	// get all tabs in active sessions
	activeSessions.forEach(data => {
		data.tabs.forEach(tabId => tabsInSession.add(tabId));
	});

	// generate tab views
	browserTabs.forEach(tab => {
		let inSession:boolean = tabsInSession.has(tab.id);

		// only add tabs that are not in an active session
		if(!inSession) {
			tabs.set(tab.id, tab);
		}

		// ignore the tab selector tab
		if(tab.id === currentTab.id) {
			return;
		}

		View.add(tab, inSession);
	});

	// event listeners for tab changes
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
		} else {
			window.location.reload();
		}
	});

	// keyboard input listener
	window.addEventListener("keydown", e => {
		if(e.keyCode == 65 && e.ctrlKey) { // CTRL + A
			e.preventDefault();

			// select all tabs unless all tabs are already selected
			let selectionChanged:boolean = selectAll();

			// if all tabs are already selected unselect all
			if(!selectionChanged) {
				unSelectAll();
			}
		} else if(e.keyCode == 73 && e.ctrlKey) { // CTRL + I
			e.preventDefault();

			invertSelection();
		}
	});

	MessageListener.setDestination("tab-selector");

	MessageListener.add("OptionUpdate", (e:SessionEvent) => {
		// if new session tabs have been created -> reload
		if(e.event === "activated") {
			window.location.reload();
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

/**
 * Selects all tabs.
 * @returns A boolean flag that indicates whether new tabs where selected
 */
export function selectAll():boolean {
	// number of previously unselected tabs
	let n = 0;

	tabs.forEach(tab => {
		if(!tab.selected) {
			n++;
			tab.selected = true;
			View.updateSelectState(tab);
		}
	});

	return n > 0;
}

export function unSelectAll():void {
	tabs.forEach(tab => {
		if(tab.selected) {
			tab.selected = false;
			View.updateSelectState(tab);
		}
	});
}

export function invertSelection():void {
	tabs.forEach(tab => {
		tab.selected = !tab.selected;
		View.updateSelectState(tab);
	});
}

export function getSelectedIds():number[] {
	let fi:FuncIterator<SelectableTab> = new FuncIterator(tabs.values());
	return fi.filter(tab => tab.selected).mapToArray(tab => tab.id);
}

init();
