var ActiveSessionManager = (function () {
	// private variables
	let sessionRootFolder = null;
	let unloadedTabs = new Set();
	let tabSessionAssoc = new Map();
	
	// regular expression that parses tab options and title from bookmark title
	const bmTitleParserRE = /^(\[(pinned)?\]\s)?(.*)$/;

	function _createProperties(bm, windowID) {
		let res = bm.title.match(bmTitleParserRE);
		let title = res[3];

		let o = {
			pinned: res[2] === "pinned",
			url: tab.url, // TODO: tab loader
			active: false
		};

		if (windowID !== undefined) { o.windowId = windowID; }

		return o;
	}

	function init(bmFolder) {
		console.assert(sessionRootFolder === null, "Already initialized!");

		setBookmarkFolder(bmFolder);

		browser.tabs.onActivated.addListener(activeInfo => {
			let tabID = activeInfo.tabId;
			// TODO
		});

		browser.tabs.onRemoved.addListener(tabID => {
			let session = getActiveSession(tabID);

			if (session) {
				//TODO: remove from session
			}
		});

		browser.tabs.onCreated.addListener(tab => {
			if (tab.openerTabId) {
				// TODO
				// URL might not be set at this point
			}
		});

		browser.tabs.onUpdated.addListener((tabID, changeInfo, tab) => {
			// TODO
			//https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/onUpdated
		});
	}

	function setBookmarkFolder(bmFolder) {
		if (bmFolder) {
			sessionRootFolder = bmFolder;
		}
	}

	function restoreSession(sessionID, newWindow) {
		let p = Promise.resolve();
		let windowID;

		if (newWindow) {
			p = browser.windows.create({
				type: "normal"
			}).then(w => {
				windowID = w.id;
			});
		}

		return p.then(() => {
			return browser.bookmarks.getChildren(sessionID).then(bmData => {
				// just bookmarks that have a URL (no folders)
				let bms = bmData.filter(bm => bm.url);

				let unloadedTabsBuffer = [];
	
				// create tabs (the promise resolves when every tab has been successfully created)
				return new Promise.all(
					bms.map(
						bm => browser.tabs.create(_createProperties(bm)).then(tab => {
							tabSessionAssoc.set(tab.id, bm);
							unloadedTabsBuffer.push(tab.id);
						})
					)
				).then(() => {
					unloadedTabsBuffer.forEach(tabID => unloadedTabs.add(tabID));
				});
			}, e => {
				console.error("Error restoring session " + sessionID);
				console.error("" + e);
	
				// let the caller know something went wrong
				return Promise.reject(e);
			});
		});
	}

	function getActiveSession(tabID) {
		return tabSessionAssoc.has(tabID) ? tabSessionAssoc.get(tabID) : null;
	}

	// exposed properties & methods
	return {
		init: init,
		setBookmarkFolder: setBookmarkFolder,
		restoreSession: restoreSession,
		getActiveSession: getActiveSession
	};
}());