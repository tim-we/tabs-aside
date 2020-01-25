import * as HTMLUtils from "../../util/HTMLUtilities.js";
import SetupStep from "./SetupStep.js";
import { Bookmark } from "../../util/Types.js";
import * as OptionsManager from "../../Options/OptionsManager.js";
import { selectBookmark } from "../../options/Controls/BookmarkControl.js";
import { apply, Edge, Classic } from "./OptionsPresets.js";

let step1 = new SetupStep("setup_root_folder_text");
let step2 = new SetupStep("setup_preset_selection_text");
let step3 = new SetupStep("setup_completed_text");

let skipButton:HTMLAnchorElement;

browser.sidebarAction.setTitle({title:"Tabs Aside"});

HTMLUtils.DOMReady().then(() => {
	HTMLUtils.i18n();

	SetupStep.setParent(document.getElementById("setup-content"));

	let version = document.getElementById("version");
	version.innerText = browser.i18n.getMessage(
		"setup_version",
		[browser.runtime.getManifest().version]
	);

	skipButton = document.getElementById("skip") as HTMLAnchorElement;
	skipButton.addEventListener("click", async e => {
		e.preventDefault();
		browser.runtime.openOptionsPage();
		close();
	});

	// hide skip button
	skipButton.style.display = "none";

	setup();
});

async function setup() {
	let rootFolder:string = await OptionsManager.getValue("rootFolder");

	if(rootFolder) {
		step1.addOption({
			text: "setup_root_folder_keep",
			action: () => Promise.resolve(),
			recommended: true
		});
	}

	step1.show();
	await step1.completion();
	// show skip button
	skipButton.style.display = "inline";

	step2.show();
	await step2.completion();

	step3.show();
	await step3.completion();

	close();
}

async function close() {
	await browser.storage.local.set({"setup": true});
	console.log("[TA] Setup completed.");

	browser.runtime.reload();
}

// ------ setup details -------

step1.addOption({
	text: "setup_root_folder_auto_create",
	action: async () => {
		let folder:Bookmark = await browser.bookmarks.create({title: "Tabs Aside"});
		console.log("[TA] Created bookmark folder 'Tabs Aside'.");
		OptionsManager.setValue<string>("rootFolder", folder.id);
	},
	recommended: true
});

step1.addOption({
	text: "setup_root_folder_select",
	action: async () => {
		await selectBookmark("rootFolder");
		let folderId = await OptionsManager.getValue<string>("rootFolder");

		return folderId ? Promise.resolve() : Promise.reject();
	}
});

step2.addOption({
	text: "setup_preset_default",
	action: () => Promise.resolve(),
	recommended: true
});

step2.addOption({
	text: "setup_preset_edge",
	action: () => apply(Edge),
	detailList: [
		"setup_preset_active_sessions_disabled",
		"setup_preset_windowed_sessions_disabled"
	]
});

step2.addOption({
	text: "setup_preset_classic",
	action: () => apply(Classic),
	detailList: ["setup_preset_windowed_sessions_disabled"]
});

step3.addOption({
	text: "setup_completed_close",
	action: () => Promise.resolve(),
	recommended: true
});

step3.addOption({
	text: "setup_completed_options_page",
	action: () => browser.runtime.openOptionsPage()
});
