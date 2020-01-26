import * as OptionsManager from "../options/OptionsManager.js";
import * as BrowserActionManager from "../browserAction/BrowserActionManager.js";

type StoredData = {
	"version"?:number,
	"options"?:any, // user options
	"setup"?:boolean, // (user) setup completed flag
	"bookmarkFolderID"?:string // legacy
	"ba-icon"?:string // legacy
};

export async function isSetup():Promise<boolean> {
	let data:StoredData = await browser.storage.local.get() || {};

	return data.version === 2 && data.setup === true;
}

export async function setup():Promise<void> {
	let data:StoredData = await browser.storage.local.get() || {};

	let icon:string|null = null;
	let root:string|null = null;

	// data migration

	if(data.version == 1) {
		if(data["bookmarkFolderID"]) {
			// this will not be removed to keep old versions working
			await browser.bookmarks.get(data["bookmarkFolderID"]).then(
				bms => {
					if(bms[0].type === "folder") {
						root = bms[0].id;
					}
				}
			).catch();
		}

		if(data["ba-icon"]) {
			// use old browser action icon setting
			if(data["ba-icon"] === "dynamic") {
				icon = "context";
			} else if(data["ba-icon"] === "light" || data["ba-icon"] === "dark") {
				icon = data["ba-icon"];
			}

			browser.storage.local.remove("ba-icon");
		}
	} else if(data.version != 2) {
		// removing the extension will also remove all the stored data
		// lets check if there exists a "Tabs Aside" folder from a previous installation
		let data = (await browser.bookmarks.search({title:"Tabs Aside"}))
					.filter(bm => bm.type === "folder");

		if(data.length > 0) {
			// folder found
			root = data[0].id;
		}
	}

	if(root !== null) {
		console.log("[TA] Found 'Tabs Aside' folder from a previous installation.");
		await OptionsManager.setValue("rootFolder", root);
	}

	if(icon === null) {
		// if no previous setting found use OS setting
		icon = window.matchMedia("(prefers-color-scheme: dark)").matches ? "light" : "dark";
		console.log("[TA] Using OS color scheme to determine icon color: " + icon);
	}

	await OptionsManager.setValue("browserActionIcon", icon || "dark");

	await browser.storage.local.set({"version": 2});

	// update browser action icon
	BrowserActionManager.init();

	// prepare user setup
	BrowserActionManager.showSetup();
	browser.sidebarAction.setPanel({
		panel: browser.runtime.getURL("html/user-setup.html")
	});
}