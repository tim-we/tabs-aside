import * as Model from "./Model";
import * as View from "./View";
import parseQueryString from "../util/parseQuerystring";
import * as OptionsManager from "../options/OptionsManager";

// url search params
var params = parseQueryString();

// is there a selected folder?
var initPromise:Promise<void>;

if (params["selected"]) {
	console.log(`[TA] [BMS] bookmark ${params["selected"]} selected`);
	let selectedFolderID = params["selected"].trim();
	initPromise = Model.init(
		params["option"],
		selectedFolderID
	);
} else {
	initPromise = Model.init(params["option"]);
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