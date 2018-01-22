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

		if (bookmarkFolder === null) {
			console.log("Bookmark folder not found, creating a new one...");
			return createTabsAsideFolder();
		}
	});
}).catch(onRejected);

function createTabsAsideFolder() {
	return browser.bookmarks.create({
		title: "Tabs Aside"
	}).then(bm => {
		console.log("Folder successfully created");

		return setSessionFolder(bm);
	}).catch(onRejected);
}

// message listener
browser.runtime.onMessage.addListener(message => {
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
		if (message.tabs) {
			let closeTabs = message.command !== "save";

			if (message.newtab) {
				// open a new empty tab (async)
				browser.tabs.create({});
			}

			// custom title?
			let title = (message.title) ? message.title : generateSessionName();

			// tabs aside!
			aside(
				message.tabs,
				closeTabs,
				bookmarkFolder.id,
				title
			);
		}
	} else if (message.command === "tab-to-session") {
		addTabToSession(message.sessionFID, message.tab, true).then(sendRefresh);
	} else if (message.command === "updateRoot") {
		browser.bookmarks.get(message.bmID).then(data => {
			if (data.length > 0) {
				setSessionFolder(data[0]);
			}
		}).then(sendRefresh);
	}
});

// tab context menu
browser.menus.create({
	id: "tabs-aside-tab-context",
	title:"Tabs Aside",
	contexts: ["tab"],
	documentUrlPatterns: ["http://*/*","https://*/*"] // array of strings
});

browser.menus.create({
	parentId: "tabs-aside-tab-context",
	title: "set aside & add to existing session",
	onclick: function (info, tab) {
		console.log(tab);
	}
});