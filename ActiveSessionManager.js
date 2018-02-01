const ActiveSessionManager = (function () {
	// regular expression that parses tab options and title from bookmark title
	const bmTitleParserRE = /^(\[(pinned)?\]\s)?(.*)$/;

	const TAB_LOADER_PREFIX = browser.extension.getURL("tab-loader/load.html") + "?";

	// private variables
	let unloadedTabs = new Map(); // map tab ids of all unloaded tabs to their actual urls
	let activeSessions = new Map(); // maps session id to sets of tab ids
	//this is needed to properly handle closed tabs:
	let tabBMAssoc = new Map(); // maps tab ids to bookmark ids

	let config = {
		tabCloseAction: "update-session",
		newWindow: false,
		showBadge: true
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

		return {
			pinned: pinned,
			url: _tabLoaderURL(bm.url, title),
			active: false,
			windowId: windowID
		};
	}

	function updateBrowserAction() {
		let n = activeSessions.size;
		let text = (config.showBadge && n>0) ? ""+n : "";
		let title = n > 0 ? `${n} active sessions` : "Tabs Aside!";
		browser.browserAction.setBadgeText({ text: text });
		browser.browserAction.setTitle({ title: title });
	}

	function findSession(tabID) {
		for (let [sessionID, tabIDs] of activeSessions.entries()) {
			if (tabIDs.has(tabID)) {
				return sessionID;
			}
		}

		return null;
	}

	// returns array of session ids
	function getActiveSessionIDs() {
		return Array.from(activeSessions.keys());
	}

	function restoreSession(sessionID, newWindow = config.newWindow) {
		// sanity-check
		if (activeSessions.has(sessionID)) {
			return Promise.reject("session already active");
		}

		let p = Promise.resolve();
		let windowID = browser.windows.WINDOW_ID_CURRENT;

		// do we need a new window?
		if (newWindow) {
			p = browser.windows.create({
				type: "normal"
			}).then(w => {
				windowID = w.id;
			});
		}

		// let's restore some tabs...
		return p.then(() => {
			return browser.bookmarks.getChildren(sessionID).then(bmData => {
				// just bookmarks that have a URL (no folders)
				let bms = bmData.filter(bm => bm.url);

				let tabIDs = new Set();
				activeSessions.set(sessionID, tabIDs);
	
				// create tabs (the promise resolves when every tab has been successfully created)
				return Promise.all(
					bms.map(
						bm => browser.tabs.create(_createProperties(bm, windowID)).then(tab => {
							unloadedTabs.set(tab.id, bm.url);
							tabIDs.add(tab.id);
							tabBMAssoc.set(tab.id, bm.id);

							return Promise.all([
								browser.sessions.setTabValue(tab.id, "sessionID", sessionID),
								browser.sessions.setTabValue(tab.id, "bookmarkID", bm.id),
								browser.sessions.setTabValue(tab.id, "loadURL", bm.url)
							]);
						})
					)
				).then(updateBrowserAction, updateBrowserAction);
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
					tabID => {
						// tab-bookmark association has to be removed first
						// otherwise the tabs.onRemoved listener would delete it
						tabBMAssoc.delete(tabID);
						unloadedTabs.delete(tabID);
						session.delete(tabID);

						// now it should be safe to remove the tab
						browser.tabs.remove(tabID);
					}
				)
			).then(() => {
				activeSessions.delete(sessionID);
				updateBrowserAction();
			});
		} else {
			console.warn("[TA] no such session: " + sessionID);
			return Promise.resolve();
		}
	}

	// input: array of (active) session ids
	// returns array of tab ids (tabs in those sessions)
	function getTabsInActiveSession(sessions = getActiveSessionIDs()) {
		return sessions.reduce(
			(tabs, sessionID) => tabs.concat(
				Array.from(
					activeSessions.get(sessionID).values()
				)
			)
		, []);
	}

	function getASData() {
		let sessionIDs = getActiveSessionIDs();

		return {
			sessions: sessionIDs,
			tabs: getTabsInActiveSession(sessionIDs)
		};
	}

	// initialization
	(function () {
		// check all tabs
		browser.tabs.query({}).then(tabs => {
			Promise.all(
				tabs.map(
					tab => browser.sessions.getTabValue(tab.id, "sessionID").then(
						sessionID => {
							if (sessionID) {
								return Promise.all([
									browser.sessions.getTabValue(tab.id, "bookmarkID"),
									browser.sessions.getTabValue(tab.id, "loadURL")
								]).then(sData => {
									let bmID = sData[0];
									let loadURL = sData[1];

									let session = activeSessions.get(sessionID);
									if (!session) {
										session = new Set();
										activeSessions.set(sessionID, session);
									}

									session.add(tab.id);
									tabBMAssoc.set(tab.id, bmID);

									if (loadURL && tab.url && tab.url.startsWith("moz-extension://")) {
										// tab was restored but the extension was stopped/disabled
										// before it was loaded (extension disabled or browser restarted)
										unloadedTabs.set(tab.id, loadURL);
									}
								});
							}
						}
					)
				)
			).catch(e => {
				console.error("[TA] Error loading tabs: " + e);
			}).then(updateBrowserAction);
		});

		// handle tab events

		browser.tabs.onActivated.addListener(activeInfo => {
			let tabID = activeInfo.tabId;
			let url = unloadedTabs.get(tabID);

			// check if tab is unloaded
			if (url) {
				// remove from list of unloaded tabs
				unloadedTabs.delete(tabID);
				browser.sessions.removeTabValue(tabID, "loadURL");

				// load tab
				browser.tabs.update(tabID, { url: url });
			}
		});

		browser.tabs.onRemoved.addListener(tabID => {

			let bmID = tabBMAssoc.get(tabID);

			if (bmID) {
				// tab was in an active session
				sessionID = findSession(tabID);

				let session = activeSessions.get(sessionID);
				session.delete(tabID);
				unloadedTabs.delete(tabID);
				tabBMAssoc.delete(tabID);
				
				if (config.tabCloseAction === "update-session") {
					// remove from bookmarks
					browser.bookmarks.remove(bmID).then(() => {
						// if session is empty, remove folder from bookmarks
						if (session.size === 0) {
							activeSessions.delete(sessionID);

							browser.bookmarks.remove(sessionID).catch(e => {
								console.error("[TA] Error removing session: " + e);
							});

							updateBrowserAction();
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
							let session = activeSessions.get(sessionID);
							session.add(tab.id);
							tabBMAssoc.set(tab.id, bm.id);

							return browser.sessions.setTabValue(tab.id, "bookmarkID", bm.id);
						});
					}
				});
			}
		});

		browser.tabs.onUpdated.addListener((tabID, changeInfo, tab) => {
			let bmID = tabBMAssoc.get(tabID);

			// Map.get returns undefined if the key can't be found
			if (bmID) {
				if (changeInfo.url && !urlFilter(changeInfo.url)) {
					return;
				}

				let changes = {};

				let url;
				if (url = unloadedTabs.get(tabID)) {
					// no title change!
					changes.url = url;
				} else {
					changes.title = makeTitle(tab.title, tab.pinned);
					changes.url = tab.url;
				}

				// update bookmark
				browser.bookmarks.update(bmID, changes).catch(e => {
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
	})();

	// exposed properties & methods
	return {
		findSession: findSession,
		getActiveSessionData: getASData,
		getActiveSessionIDs: getActiveSessionIDs,
		restoreSession: restoreSession,
		setSessionAside: setSessionAside
	};
}());