import * as Model from "./Model";
import * as View from "./View";
import parseQueryString from "../util/parseQuerystring";
import * as OptionsManager from "../options/OptionsManager";

// url search params
var params = parseQueryString();

// is there a selected folder?
var initPromise:Promise<void>;

if (params["selected"]) {
	console.log(`ID ${params["selected"]} selected`);
	let selectedFolderID = params["selected"].trim();
	initPromise = Model.init(selectedFolderID);
} else {
	initPromise = Model.init();
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

export function selectRootFolder(folderId:string) {
	OptionsManager.setValue("rootFolder", folderId);
}