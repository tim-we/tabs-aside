import * as HTMLUtils from "../../util/HTMLUtilities.js";
import SetupStep from "./SetupStep.js";
import { Bookmark } from "../../util/Types.js";
import * as OptionsManager from "../../options/OptionsManager.js";
import { selectBookmark } from "../../options/Controls/BookmarkControl.js";
import { apply, Edge, Classic } from "./OptionsPresets.js";

let step1 = new SetupStep("setup_root_folder_text");
let step2 = new SetupStep("setup_preset_selection_text");
let step3 = new SetupStep("setup_completed_text");

let setupContainer:HTMLElement;
let skipButton:HTMLAnchorElement;

browser.sidebarAction.setTitle({title:"Tabs Aside"});

HTMLUtils.DOMReady().then(() => {
	HTMLUtils.i18n();

	setupContainer = document.getElementById("setup-content");
	SetupStep.setParent(setupContainer);

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

	setup().catch(e => {
		console.error("[TA] Setup failed: " + e);
	});
});

async function setup() {
	let rootFolder:string|null = await OptionsManager.getValue("rootFolder");

	// add a button to keep the root folder from a previous installation
	if(rootFolder) {
		step1.addOption({
			text: "setup_root_folder_keep",
			action: () => Promise.resolve(),
			recommended: true
		});
	}

	// changelog box
	{
		let box = createBox();
		let a = document.createElement("a");
		a.href = "https://github.com/tim-we/tabs-aside/wiki/Tabs-Aside-3-::-Whats-new%3F";
		a.innerText = browser.i18n.getMessage("setup_changelog");
		let text = document.createElement("p");
		text.innerText = browser.i18n.getMessage("setup_changelog_text");
		text.appendChild(document.createElement("br"));
		text.appendChild(a);
		box.appendChild(text);
		setupContainer.appendChild(box);
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

function createBox(text?:string):HTMLDivElement {
	let box = document.createElement("div");
	box.classList.add("content-box");

	if(text) {
		let ps = HTMLUtils.stringToParagraphs(text);
		ps.forEach(p => box.appendChild(p));
	}
	
	return box;
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
