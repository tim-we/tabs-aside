const GITHUB_PROJECT_ROOT = "https://github.com/tim-we/tabs-aside";

browser.runtime.onInstalled.addListener(details => {
	// Whats new page logic
	let showWhatsNew = false;

	if(details.reason === "update") {
		let mainVersion = details.previousVersion.split(".")[0];

		if(mainVersion == "1") {
			// show if updated from v1.x
			showWhatsNew = true;
		}
	} else if(details.reason === "install") {
		// show on first installation
		showWhatsNew = true;
	}

	if(showWhatsNew) {
		browser.tabs.create({
			active: true,
			url: GITHUB_PROJECT_ROOT + "/wiki/Tabs-Aside-v2.0:-What's-new%3F"
		});
	}
});