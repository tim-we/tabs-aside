import * as Model from "./Model.js";
import * as View from "./View.js";
import * as OptionsManager from "../options/OptionsManager.js";

const params = new URLSearchParams(document.location.search.substring(1));

// is there a selected folder?
var initPromise:Promise<void>;

if (params.get("selected")) {
	let selectedFolderID = params.get("selected");
	initPromise = Model.init(
		params.get("option"),
		selectedFolderID
	);
} else {
	initPromise = Model.init(params.get("option"));
}

Promise.all([
	initPromise,
	new Promise(resolve => {
		window.addEventListener("load", () => {
			View.init();

			resolve();
		});
	})
]).then(_ => View.update());

export async function select() {
	if (Model.selectedFolderID) {
		await OptionsManager.setValue(
			Model.OptionId,
			Model.selectedFolderID
		);

		// close this window
		let wnd:browser.windows.Window = await browser.windows.getCurrent();
		browser.windows.remove(wnd.id);
	} else {
		alert(browser.i18n.getMessage("bookmarkFolderSelector_noSelection"));
	}
}