// bookmark folder that contains the session folders
var bookmarkFolder = null;

function setSessionFolder(bmFolder) {
	if (!isBMFolder(bmFolder)) {
		return Promise.reject(new Error("thats not a folder"));
	}
	bookmarkFolder = bmFolder;

	console.log("BM folder ID set to " + bookmarkFolder.id);

	setTimeout(sendRefresh, 100);

	return browser.storage.local.set({
		bookmarkFolderID: bmFolder.id
	});
}

browser.storage.local.get("version").then(data => {
	if (data.version) {
		console.assert(data.version === 1, "Invalid data version!");
	} else {
		browser.storage.local.set({
			version: 1
		});

		// check if this is a clean install or if the extension was just updated
		return browser.storage.local.get("session").then(data => {
			if (data.session) {
				console.log("old data format detected!\nmigrating data...");
				browser.storage.local.remove("session");

				// let's find the old Tabs Aside folder
				console.log("searching for the Tabs Aside folder");
				return browser.bookmarks.search("Tabs Aside").then(data => {
					let folders = data.filter(bm => isBMFolder(bm));
					
					if (folders.length > 0) {
						// data migration
						return setSessionFolder(folders[0]).then(() => {
							console.log("data migration successful");
							return Promise.resolve();
						});
					}
				});
			} else {
				// seems to be a new installation
				// nothing to do here
				return Promise.resolve();
			}
		});
	}
}).then(() => {
	// load sessions root folder (Tabs Aside folder)
	return getSessionRootFolder().then(folder => {
		bookmarkFolder = folder;
	}, e => {
		console.log(e);
		console.log("Creating a new bookmark folder...");
		return createTabsAsideFolder();
	});
}).then(() => {
	updateTabMenus();
}).catch(onRejected);

function createTabsAsideFolder() {
	return browser.bookmarks.create({
		title: "Tabs Aside"
	}).then(bm => {
		console.log("Folder successfully created");

		return setSessionFolder(bm);
	}).catch(onRejected);
}

function asideMessageHandler(message) {
	if (message.tabs) {
		let closeTabs = message.command !== "save";

		// newtab property is optional (defaults to false)
		if (message.newtab) {
			// open a new empty tab (async)
			browser.tabs.create({});
		}

		if (message.sessionID) {
			// add to existing session
			// this is all async so tabs could be out of order
			Promise.all(
				message.tabs.map(
					tab => addTabToSession(message.sessionID, tab, closeTabs)
				)
			).then(sendRefresh);
		} else {
			// creating a new session

			// custom title?
			let title = (message.title) ? message.title : generateSessionName();

			// tabs aside!
			aside(
				message.tabs,
				closeTabs,
				bookmarkFolder.id,
				title
			).then(() => {
				updateTabMenus();
			});
		}
	}
}

// message listener
browser.runtime.onMessage.addListener(async message => {
	if (message.command === "asideAll") {
		// DEPRECATED
		var closeTabs = !message.save;

		getTabs().then((tabs) => {
			if (closeTabs && !hasAboutNewTab(tabs)) {
				// open a new empty tab (async)
				browser.tabs.create({});
			}

			// tabs aside!
			return aside(
				tabs.filter(tabFilter),
				closeTabs,
				bookmarkFolder.id,
				generateSessionName()
			);
		}).catch(onRejected);
	
	} else if (message.command === "aside" || message.command === "save") {
		asideMessageHandler(message);
	} else if (message.command === "updateRoot") {
		browser.bookmarks.get(message.bmID).then(data => {
			if (data.length > 0) {
				setSessionFolder(data[0]);
			}
		}).then(refresh);
	} else if (message.command === "refresh") {
		updateTabMenus();
	}
});

function refresh() {
	updateTabMenus();

	return sendRefresh();
}