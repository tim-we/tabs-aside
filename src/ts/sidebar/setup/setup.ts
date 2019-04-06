import * as HTMLUtils from "../../util/HTMLUtilities.js";
import SetupStep from "./SetupStep.js";
import { Bookmark } from "../../util/Types.js";
import * as OptionsManager from "../../Options/OptionsManager.js";
import { wait, rejects } from "../../util/PromiseUtils.js";
import { selectBookmark } from "../../options/Controls/BookmarkControl.js";

let step1 = new SetupStep("setup_root_folder_text");

step1.addOption("setup_root_folder_auto_create", async () => {
	let folder:Bookmark = await browser.bookmarks.create({title: "Tabs Aside"});
	console.log("[TA] Created bookmark folder 'Tabs Aside'.");
	OptionsManager.setValue<string>("rootFolder", folder.id);
}, true);

step1.addOption("setup_root_folder_select", async () => {
	await selectBookmark("rootFolder");
	let folderId = await OptionsManager.getValue<string>("rootFolder");

	return folderId ? Promise.resolve() : Promise.reject();
});

browser.sidebarAction.setTitle({title:"Tabs Aside"});

HTMLUtils.DOMReady().then(() => {
	HTMLUtils.i18n();

	SetupStep.setParent(document.getElementById("setup-content"));

	let version = document.getElementById("version");
	version.innerText = browser.i18n.getMessage(
		"setup_version",
		[browser.runtime.getManifest().version]
	);

	let skip = document.getElementById("skip") as HTMLAnchorElement;
	skip.addEventListener("click", e => {
		e.preventDefault();
		browser.runtime.openOptionsPage();
		completed();
	});

	setup();
});

async function setup() {
	step1.show();
	await step1.completion();

	completed();
}

async function completed() {
	console.log("[TA] Setup completed.");

	// reset sidebar
	browser.sidebarAction.setTitle({title:null});
	browser.sidebarAction.setPanel({panel:null});
}