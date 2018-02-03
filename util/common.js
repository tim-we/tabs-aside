const utils = {

	wait: ms => new Promise(resolve => setTimeout(resolve, ms)),

	// regular expression that parses tab options and title from bookmark title:
	bmTitleParserRE: /^(\[(pinned)?\]\s)?(.*)$/,

	isBMFolder: bm => bm.type === "folder" || !bm.url,

	urlFilter: url => url.startsWith("http") || url.startsWith("view-source:"),

	generateTabBMTitle: tab => (tab.pinned ? "[pinned] " : "") + tab.title.trim(),

	containsEmptyTab: tabs => tabs.some(tab => tab.url === "about:newtab"),

	getTabs: options => {
		let queryInfo = {};

		if (options.currentWindow !== undefined) {
			queryInfo.currentWindow = options.currentWindow;
		}

		let promise;

		if (options.pinned === undefined) {
			// fallback to the default setting (configured in the extension options)
			promise = browser.storage.local.get("ignore-pinned").then(data => {
				if (data["ignore-pinned"] || data["ignore-pinned"] === undefined) {
					// exclude pinned tabs (default if "ignore-pinned" is not set)
					queryInfo.pinned = false;
				}
			});
		} else {
			queryInfo.pinned = options.pinned;
			promise = Promise.resolve();
		}

		return promise.then(() => browser.tabs.query(queryInfo));
	},

	getURLSearchParams: () => new URLSearchParams(document.location.search.substring(1))
}