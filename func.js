// adds a single tab to a session, returns a promise
function addTabToSession(sessionFolderID, tab, closeTab) {
	// bookmark title (may include some state info)
	let title = tab.title.trim();
	if(tab.pinned) {
		title = '[pinned] ' + title;
	}

	return browser.bookmarks.create({
		parentId: sessionFolderID,
		title: title,
		url: tab.url
	}).then(() => {
		// close tab or skip (return resolved promise)
		return closeTab ? browser.tabs.remove(tab.id) : Promise.resolve();
	});
}

// sets the tabs aside (returns a promise)
function aside(tabs, closeTabs, parentBookmarkID, sessionTitle) {
	if (tabs.length === 0) { return Promise.resolve(); }

	// this sessions bookmark folder id
	var pID = null;

	// a function that closes & stores the tabs one by one recursively
	function asideOne() {
		// get the first tab & remove it fram tab array
		let tab = tabs.shift();

		return addTabToSession(pID, tab, closeTabs).then(() => {
			return tabs.length > 0 ? asideOne() : Promise.resolve();
		});
	}

	if (tabs.length > 0) {
		// create session bm folder (& return promise chain)
		return browser.bookmarks.create({
			parentId: parentBookmarkID,
			title: sessionTitle
		}).then(bm => {
			pID = bm.id;

			// move tabs aside one by one (recursive)
			return asideOne();
		}).catch(error => console.log("Error: " + error));
	} else {
		console.warn("No tabs to set aside!");
		return Promise.resolve();
	}
}

function sendRefresh() {
	return browser.runtime.sendMessage({ command: "refresh" }).catch(error => {
		console.log("No receiver");
	});
}

function generateSessionName(prefix = "Session") {
	let now = new Date();

	return prefix + ` ${now.getMonth()+1}/${now.getDate()}`
}

function getSessionRootFolderID() {
	return browser.storage.local.get("bookmarkFolderID").then(data => {
		return data.bookmarkFolderID ?
			data.bookmarkFolderID :
			Promise.reject("bookmarkFolderID was not set");
	});
}

function getSessionRootFolder() {
	return getSessionRootFolderID().then(bmID => {
		return browser.bookmarks.getSubTree(bmID).then(data => {
			return isBMFolder(data[0]) ?
				Promise.resolve(data[0]) :
				Promise.reject(`folder with id ${bmID} not found!`);
		});
	});
}

function getSessions(sessionsRootFolder) {
	return sessionsRootFolder ? sessionsRootFolder.children.filter(isBMFolder) : [];
}