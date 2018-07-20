import * as HTMLUtils from "../util/HTMLUtilities";
import { Tab, TabId, SelectableTab, toggleTab, selectAll, unSelectAll, invertSelection } from "./TabSelector";

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
	});
}

export function add(tab:SelectableTab) {
	let view:HTMLElement = createTabView(tab);
	tabsContainer.appendChild(view);
	tabs.set(tab.id, view);
}

export function update(tab:SelectableTab) {
	let view:HTMLElement = tabs.get(tab.id);
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

function createTabView(tab:Tab):HTMLElement {
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