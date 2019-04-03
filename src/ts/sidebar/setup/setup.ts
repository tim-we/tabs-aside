import * as HTMLUtils from "../../util/HTMLUtilities.js";
import * as BookmarkControl from "../../options/Controls/BookmarkControl.js";
import SetupStep from "./SetupStep.js";

let step1 = new SetupStep("setup_root_folder_text");

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

	step1.show();
});

async function completed() {
	//TODO
}