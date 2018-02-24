const utils = {

	wait: ms => new Promise(resolve => setTimeout(resolve, ms)),

	// regular expression that parses tab options and title from bookmark title:
	bmTitleParserRE: /^(\[(pinned)?\]\s)?(.*)$/,

	isBMFolder: bm => bm.type === "folder" || !bm.url,

	urlFilter: url => url.startsWith("http") || url.startsWith("view-source:"),

	generateTabBMTitle: tab => (tab.pinned ? "[pinned] " : "") + tab.title.trim(),

	containsEmptyTab: tabs => tabs.some(tab => tab.url === "about:newtab"),

	getTabs: (options = {}) => {
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

	getURLSearchParams: () => new URLSearchParams(document.location.search.substring(1)),

	createHTMLElement: (tagName, attrs, classes, content) => {
		let element = document.createElement(tagName);
	
		// add attributes
		Object.getOwnPropertyNames(attrs).forEach(k => {
			element.setAttribute(k, attrs[k]);
		});
	
		// add classes
		classes.forEach(c => { element.classList.add(c); });
	
		if (content) {
			element.innerText = content;
		}
	
		return element;
	},

	/* returns a promise that gets resolved if
	 * one of the given promises is resolved
	 * @param promises - array of promises
	 */
	promiseOne(promises) {
		let resolved = false;

		return new Promise((resolve, reject) => {
			promises.forEach(p => {
				p.then(() => {
					if (!resolved) {
						resolved = true;
						resolve();
					}
				}, reject);
			})
		});
	},

	getActiveTab() {
		return browser.tabs.query({
			active: true,
			currentWindow: true
		}).then(tabs => tabs[0]);
	},

	waitUntilPageIsLoaded() {
		return new Promise(resolve => {
			window.addEventListener("load", resolve);
		});
	}
}