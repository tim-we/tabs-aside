import {i18n, DOMReady} from "../util/HTMLUtilities.js";

(async function(){
	await DOMReady();
	i18n();

	let button = document.getElementById("launch-setup");

	button.addEventListener("click", () => {
		/*await*/ browser.sidebarAction.setPanel({panel:browser.runtime.getURL("html/setup.html")});
		browser.sidebarAction.open();
		window.close();
	});

	browser.browserAction.setBadgeText({text:null});
})();
