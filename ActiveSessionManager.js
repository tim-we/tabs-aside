const ActiveSessionManager = (function () {
	// regular expression that parses tab options and title from bookmark title
	const bmTitleParserRE = /^(\[(pinned)?\]\s)?(.*)$/;

	const TAB_LOADER_PREFIX = browser.extension.getURL("tab-loader/load.html") + "?";

	// private variables
	let sessionRootFolder = null;
	let unloadedTabs = new Set();
	let tabSessionAssoc = new Map();

	let config = {
		tabCloseAction = "update-session",
		newWindow = false
	};

	function _tabLoaderURL(url, title) {
		return TAB_LOADER_PREFIX + [
			`url=${encodeURIComponent(url)}`,
			`title=${encodeURIComponent(title)}`
		].join("&");
	}

	// has sideeffects:
	// bm will be extended by the following properies: actualTitle, pinned
	function _createProperties(bm, windowID) {
		// parse title
		let results = bm.title.match(bmTitleParserRE);

		let title = bm.actualTitle = results[3];
		let pinned = bm.pinned = (results[2] === "pinned");

		let o = {
			pinned: pinned,
			url: _tabLoaderURL(tab.url, title),
			active: false
		};

		if (windowID !== undefined) { o.windowId = windowID; }

		return o;
	}

	function init(bmFolder) {
		if (sessionRootFolder !== null) {
			throw new Error("[TA] Already initialized!");
		}

		setBookmarkFolder(bmFolder);

		browser.tabs.onActivated.addListener(activeInfo => {
			let tabID = activeInfo.tabId;
			
			// check if tab is unloaded
			if (unloadedTabs.has(tabID)) {
				// load tab
				browser.tabs.update(tabID, {
					url: tabSessionAssoc.get(tabID)
				}).then(() => {
					// remove 
					unloadedTabs.delete(tabID);
				});
			}
		});

		browser.tabs.onRemoved.addListener(tabID => {
			let session = getActiveSession(tabID);

			if (session) {
				if (config.tabCloseAction === "update-session") {
					let bm = tabSessionAssoc.get(tabID);

					browser.bookmarks.remove(bm.id).catch(e => {
						console.error("[TA] Error removing bookmark: " + e);
					});
				} else {
					if (unloadedTabs.has(tabID)) {
						unloadedTabs.delete(tabID);
					}

					tabSessionAssoc.delete(tabID);
				}
			}
		});

		browser.tabs.onCreated.addListener(tab => {
			let parent;

			if (tab.openerTabId && (parent = tabSessionAssoc.get(tab.openerTabId))) {
				// tab was opened by another tab from this session
				// let's add this tab to the session:

				browser.bookmarks.create({
					parentId: parent.id,
					title: tab.title,
					url: tab.url
				}).then(bm => {
					tabSessionAssoc.set(tab.id, bm);
				});
			}
		});

		browser.tabs.onUpdated.addListener((tabID, changeInfo, tab) => {
			let bm;

			// Map.get returns undefined if the key can't be found
			if (changeInfo.url !== undefined &&
				!unloadedTabs.has(tabID) &&
				(bm = tabSessionAssoc.get(tabID)))
			{
				if (!tabFilter(changeInfo.url)) {
					return;
				}

				let changed = false;

				// check for differences:
				if (tab.url && tab.url !== bm.url) {
					changed = true;
					bm.url = tab.url;
				}

				if (tab.pinned !== bm.pinned) {
					changed = true;
					bm.pinned = tab.pinned;
				}

				if (tab.title !== bm.actualTitle) {
					changed = true;
					bm.actualTitle = tab.title;
				}

				if (changed) {
					// something changed
					let title = makeTitle(bm.actualTitle, bm.pinned);

					// update bookmark
					browser.bookmarks.update(bm.id, {
						title: title,
						url: bm.url
					}).catch(e => {
						// bookmark with that id does not exist (anymore)
						console.error("[TA] " + e);

						// let's create a new one
						browser.bookmarks.create({
							parentId: bm.parentId,
							title: title,
							url: bm.url
						}).then(newBM => {
							bm.id = newBM.id
						}).catch(e => {
							// perhaps the sessions bookmark folder does not exist (anymore)
							console.error("[TA] " + e);
						});
					});
				}
			}
		});
	}

	function setBookmarkFolder(bmFolder) {
		if (bmFolder) {
			sessionRootFolder = bmFolder;
		}
	}

	function restoreSession(sessionID, newWindow = config.newWindow) {
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
				console.error("[TA] Error restoring session " + sessionID);
				console.error("[TA] " + e);
	
				// let the caller know something went wrong
				return Promise.reject(e);
			});
		});
	}

	function getActiveSessionID(tabID) {
		let bm = tabSessionAssoc.get(tabID);

		return bm ? bm.id : null;
	}

	// exposed properties & methods
	return {
		init: init,
		setBookmarkFolder: setBookmarkFolder,
		restoreSession: restoreSession,
		getActiveSessionID: getActiveSessionID
	};
}());