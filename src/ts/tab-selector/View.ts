import * as HTMLUtils from "../util/HTMLUtilities.js";
import { Tab, TabId, SelectableTab, toggleTab, selectAll, unSelectAll, invertSelection, getSelectedIds } from "./TabSelector.js";
import { SessionCommand } from "../messages/Messages.js";

let tabs:Map<TabId, HTMLElement> = new Map();

let tabsContainer:HTMLElement;

export function init() {
	return HTMLUtils.DOMReady().then(() => {
		tabsContainer = document.getElementById("tabs");

		// apply localization
		HTMLUtils.i18n();

		// selection control buttons
		let selectControls:HTMLElement = document.getElementById("select-controls");
		selectControls.querySelector("#select-all").addEventListener("click", selectAll);
		selectControls.querySelector("#clear").addEventListener("click", unSelectAll);
		selectControls.querySelector("#invert").addEventListener("click", invertSelection);

		// action buttons
		let footerControls:HTMLElement = document.querySelector("footer");
		footerControls.querySelector("#create-session").addEventListener("click", () => {
			browser.sidebarAction.open();
			SessionCommand.send("create", [null, getSelectedIds()]);
			unSelectAll();
		});

		footerControls.querySelector("#close").addEventListener("click", () => {
			browser.tabs.remove(getSelectedIds());
		});
	});
}

export function add(tab:SelectableTab, inSession:boolean = false) {
	let view:HTMLElement = createTabView(tab, !inSession);

	if(inSession) {
		view.classList.add("in-session");
		view.title = browser.i18n.getMessage("tab_selector_in_session");
	}

	tabsContainer.appendChild(view);
	tabs.set(tab.id, view);
}

export function updateSelectState(tab:SelectableTab) {
	let view:HTMLElement = tabs.get(tab.id);
	if(!view) { return; }

	if(tab.selected) {
		view.classList.add("selected");
	} else {
		view.classList.remove("selected");
	}
}

export function update(tab:SelectableTab) {
	let view:HTMLElement = tabs.get(tab.id);
	if(!view) { return; }

	let newView:HTMLElement = createTabView(tab);

	view.parentElement.replaceChild(newView, view);
	tabs.set(tab.id, newView);
}

export function remove(tab:SelectableTab) {
	let view:HTMLElement = tabs.get(tab.id);

	if(view) {
		tabs.delete(tab.id);
		view.remove();
	}
}

function createTabView(tab:Tab, selectable:boolean = true):HTMLElement {
	let html:HTMLElement = document.createElement("div");
	html.classList.add("tab");
	html.title = tab.title;
	html.dataset.id = tab.id+"";

	if(tab.selected) {
		html.classList.add("selected");
	}

	// favicon
	let img = new Image();
	img.classList.add("favicon");

	if (tab.favIconUrl) {
		// if image can not be loaded (e.g. broken or not found)
		img.onerror = () => {
			// show tab icon as favicon
			img.src = browser.runtime.getURL("img/tab-dark-16.svg");
		};

		img.src = tab.favIconUrl;
	} else {
		img.src = browser.runtime.getURL("img/tab-dark-16.svg");
	}

	html.appendChild(img);

	// tab title
	let title:HTMLElement = document.createElement("div");
	title.classList.add("tab-title");
	title.textContent = tab.title;
	html.appendChild(title);

	// click handler
	html.addEventListener("click", () => {
		let selected:boolean = toggleTab(tab.id);

		if(selected) {
			html.classList.add("selected");
		} else {
			html.classList.remove("selected");
		}
	});

	return html;
}