import * as HTMLUtils from "../../util/HTMLUtilities.js";
import SetupStep from "./SetupStep.js";
import { Bookmark } from "../../util/Types.js";
import * as OptionsManager from "../../Options/OptionsManager.js";
import { wait, rejects } from "../../util/PromiseUtils.js";

let step1 = new SetupStep("setup_root_folder_text");
step1.addOption("setup_root_folder_auto_create", async () => {
	let folder:Bookmark = await browser.bookmarks.create({title: "Tabs Aside"});
	console.log("[TA] Created bookmark folder 'Tabs Aside'.");
	OptionsManager.setValue<string>("rootFolder", folder.id);
}, true);
step1.addOption("setup_root_folder_select", async () => {
	let url = browser.runtime.getURL("html/bookmark-selector.html");
		url += "?fpreset=" + encodeURIComponent("Tabs Aside");
		url += "&option=" + encodeURIComponent("rootFolder");

	let wnd:browser.windows.Window = await browser.windows.create({
		allowScriptsToClose: true,
		width: 500,
		height: 300,
		titlePreface: "Tabs Aside! ",
		type: "popup",
		url: url
	});

	while(true) {
		await wait(500);
		let folderId = await OptionsManager.getValue<string>("rootFolder");
		if(folderId !== null) {
			break;
		} else if(await rejects(browser.windows.get(wnd.id))) {
			// stop this loop if the window was closed
			return Promise.reject();
		}
	}
});

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
	//TODO
}