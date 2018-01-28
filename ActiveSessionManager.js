const ActiveSessionManager = (function () {
	// regular expression that parses tab options and title from bookmark title
	const bmTitleParserRE = /^(\[(pinned)?\]\s)?(.*)$/;

	const TAB_LOADER_PREFIX = browser.extension.getURL("tab-loader/load.html") + "?";

	// private variables
	let sessionRootFolder = null;
	let unloadedTabs = new Map(); // map tab ids of all unloaded tabs to their actual urls
	let activeSessions = new Map(); // maps session id to sets of tab ids
	//this is needed to properly handle closed tabs
	let tabBMAssoc = new Map(); // maps tab ids to bookmark ids

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

	function findSession(tabID) {
		for (let [sessionID, tabIDs] of activeSessions.entries()) {
			if (tabIDs.has(tabID)) {
				return sessionID;
			}
		}

		return null;
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

				let tabIDs = new Set();
				activeSessions.set(sessionID, tabIDs);
	
				// create tabs (the promise resolves when every tab has been successfully created)
				return new Promise.all(
					bms.map(
						bm => browser.tabs.create(_createProperties(bm)).then(tab => {
							unloadedTabsBuffer.push({ id: tab.id, url: url });
							tabIDs.add(tab.id);
							tabBMAssoc.set(tab.id, bm.id);
						})
					)
				).then(() => {
					unloadedTabsBuffer.forEach(t => unloadedTabs.set(t.id, t.url));
				});
			}, e => {
				console.error("[TA] Error restoring session " + sessionID);
				console.error("[TA] " + e);
	
				// let the caller know something went wrong
				return Promise.reject(e);
			});
		});
	}

	function setSessionAside(sessionID) {
		let session = activeSessions.get(sessionID);

		if (session) {
			return Promise.all(
				Array.from(session.values()).map(
					tabID => browser.tabs.remove(tabID)
				)
			);
		} else {
			console.warn("[TA] no such session: " + sessionID);
			return Promise.resolve();
		}
	}

	function init(bmFolder) {
		if (sessionRootFolder !== null) {
			throw new Error("[TA] Already initialized!");
		}

		setBookmarkFolder(bmFolder);

		// check all tabs
		browser.tabs.query({}).then(tabs => {
			Promise.all(
				tabs.map(
					tab => browser.sessions.getTabValue(tab.id, "sessionID").then(
						sessionID => {
							if (sessionID) {
								return browser.sessions.getTabValue(tab.id, "bookmarkID").then(
									bmID => {
										let session = activeSessions.get(sessionID);
										if (!session) {
											session = new Set();
											activeSessions.set(sessionID, session);
										}

										session.add(tab.id);
										tabBMAssoc.set(tab.id, bmID);
									}
								)
							}
						}
					)
				)
			).catch(e => {
				console.error("[TA] Error loading tabs: " + e);
			});
		});

		// handle tab events

		browser.tabs.onActivated.addListener(activeInfo => {
			let tabID = activeInfo.tabId;
			let url;

			// check if tab is unloaded
			if (url = unloadedTabs.get(tabID)) {
				// load tab
				browser.tabs.update(tabID, {
					url: url
				}).then(() => {
					// remove 
					unloadedTabs.delete(tabID);
				});
			}
		});

		browser.tabs.onRemoved.addListener(tabID => {

			let bmID = tabBMAssoc.get(tabID);

			if (bmID) {
				// tab was in an active session

				sessionID = findSession(tabID);

				let session = activeSessions.get(sessionID);
				session.delete(tabID);
				unloadedTabs.remove(tabID);
				
				if (config.tabCloseAction === "update-session") {
					// remove from bookmarks
					browser.bookmarks.remove(bmID).then(() => {
						// if session is empty, remove folder from bookmarks
						if (session.size === 0) {
							browser.bookmarks.remove(sessionID).catch(e => {
								console.error("[TA] Error removing session: " + e);
							});
						}
					}, e => {
						console.error("[TA] Error removing bookmark: " + e);
					});
				}
			}
		});

		browser.tabs.onCreated.addListener(tab => {
			if (tab.openerTabId) {
				browser.sessions.getTabValue(tab.openerTabId, "sessionID").then(sessionID => {
					if (sessionID) {
						// tab was opened by a tab in a session
						// let's add this tab to that session:

						browser.sessions.setTabValue(tab.id, "sessionID", sessionID);

						browser.bookmarks.create({
							parentId: sessionID,
							title: makeTitle(tab.title, tab.pinned),
							url: tab.url
						}).then(bm => {
							let session = activeSessions.get(parent.id);
							session.add(tab.id);
							tabBMAssoc.set(tab.id, bm.id);
						});
					}
				});
			}
		});

		browser.tabs.onUpdated.addListener((tabID, changeInfo, tab) => {
			let bmID;

			// Map.get returns undefined if the key can't be found
			if (changeInfo.url !== undefined && (bmID = tabBMAssoc.get(tabID))) {
				if (unloadedTabs.has(tabID) || !tabFilter(changeInfo.url)) {
					return;
				}

				let title = makeTitle(tab.title, tab.pinned);

				// update bookmark
				browser.bookmarks.update(bmID, {
					title: title,
					url: tab.url
				}).catch(e => {
					// bookmark with that id does not exist (anymore)
					console.error("[TA] " + e);

					// let's create a new one
					browser.bookmarks.create({
						parentId: bm.parentId,
						title: title,
						url: tab.url
					}).then(bm => {
						tabBMAssoc.set(tabID, bm);
					}).catch(e => {
						// perhaps the sessions bookmark folder does not exist (anymore)
						console.error("[TA] " + e);
					});
				});
			}
		});
	}

	// returns array of session ids
	function getActiveSessionIDs() {
		return Array.from(activeSessions.keys());
	}

	// exposed properties & methods
	return {
		init: init,
		setBookmarkFolder: setBookmarkFolder,
		restoreSession: restoreSession,
		getActiveSessionIDs: getActiveSessionIDs,
		setSessionAside: setSessionAside
	};
}());