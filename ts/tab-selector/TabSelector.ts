import * as HTMLUtils from "../util/HTMLUtilities";

HTMLUtils.DOMReady().then(() => {
	console.log("localizing");
	// apply localization
	HTMLUtils.i18n();
});