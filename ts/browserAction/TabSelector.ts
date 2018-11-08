import * as HTMLUtils from "../util/HTMLUtilities";
import { Tab } from "../util/Types";

var selectionHTML:HTMLElement;

function getTabs(selected?:boolean):Promise<Tab[]> {
	return browser.tabs.query({
		currentWindow: true,
		highlighted: selected
	});
}

async function invertSelection() {
	let tabs = await getTabs();
	
	await Promise.all(
		tabs.map(tab =>
			browser.tabs.update(tab.id, {
				active: tab.active,
				highlighted: tab.active || !tab.highlighted
			})
		)
	);

	updateSelectionView();
}

async function unSelectAll() {
	let tabs = await getTabs(true);

	if(tabs.length > 0) {
		await Promise.all(
			tabs.map(tab => browser.tabs.update(tab.id, {highlighted:false}))
		);

		updateSelectionView();
	}
}

async function selectAll() {
	let tabs = await getTabs(false);

	if(tabs.length > 0) {
		await Promise.all(
			tabs.map(tab => browser.tabs.update(tab.id, {
				active: tab.active,
				highlighted: true
			}))
		);

		updateSelectionView();
	}
}

async function updateSelectionView() {
	let tabs = await browser.tabs.query({currentWindow: true});

	let n:number = tabs.reduce(
		(acc:number, tab:Tab) => tab.highlighted ? acc+1 : acc,
		0
	);

	let text:string = browser.i18n.getMessage("tab_selector_selection", [n, tabs.length]);

	selectionHTML.textContent = text;
}

async function getSelectedIds():Promise<number[]> {
	let tabs = await browser.tabs.query({
		currentWindow: true,
		highlighted: true
	});

	return tabs.map(tab => tab.id);
}

(async function() {
	await HTMLUtils.DOMReady();

	// apply localization
	HTMLUtils.i18n();

	selectionHTML = document.getElementById("selection");
	updateSelectionView();

	// selection control buttons
	let selectControls:HTMLElement = document.getElementById("select-controls");
	selectControls.querySelector("#select-all").addEventListener("click", selectAll);
	selectControls.querySelector("#clear").addEventListener("click", unSelectAll);
	selectControls.querySelector("#invert").addEventListener("click", invertSelection);

	// keyboard input listener
	window.addEventListener("keydown", async (e) => {
		if(e.keyCode == 65 && e.ctrlKey) { // CTRL + A
			e.preventDefault();

			if((await getTabs(false)).length) {
				selectAll();
			} else {
				unSelectAll();
			}
		} else if(e.keyCode == 73 && e.ctrlKey) { // CTRL + I
			e.preventDefault();

			invertSelection();
		}
	});
})();