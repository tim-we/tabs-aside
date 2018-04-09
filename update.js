const GITHUB_PROJECT_ROOT = "https://github.com/tim-we/tabs-aside";

browser.runtime.onInstalled.addListener(details => {
	if(details.reason === "update") {
		let mainVersion = details.previousVersion.split(".")[0];

		if(mainVersion == "1") {
			browser.tabs.create({
				url: GITHUB_PROJECT_ROOT + "/wiki/Tabs-Aside-v2.0:-What's-new%3F"
			});
		}
    }
});