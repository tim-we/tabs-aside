// bookmark folder that contains the session folders
var bookmarkFolderID = null;

function setSessionFolder(bmFolderID) {
	return browser.bookmarks.getSubTree(bmFolderID).then(data => {
		return isBMFolder(data[0]) ?
			Promise.resolve(data[0]) :
			Promise.reject(new Error("thats not a folder"));
	}).then(folder => {
		bookmarkFolderID = folder.id;

		console.log("BM folder ID set to " + bookmarkFolderID);

		return browser.storage.local.set({
			bookmarkFolderID: folder.id
		});
	});
}

browser.storage.local.get("version").then(data => {
	if (data.version) {
		console.assert(data.version === 1, "Invalid data version!");
	} else {
		browser.storage.local.set({
			version: 1
		});

		return browser.storage.local.get("session").then(data => {
			if (data.session) {
				browser.storage.local.remove("session");
			}
		});
	}
}).then(() => {
	// load sessions root folder (Tabs Aside folder)
	// (verify there actually is a folder with that ID)
	return getSessionRootFolderID().then(folderID => {
		bookmarkFolderID = folderID;
	}, e => {
		console.log(e);

		// checking if there already is a tabs aside folder
		console.log("searching for a 'Tabs Aside' folder");
		return browser.bookmarks.search({title:"Tabs Aside"}).then(data => {
			let folders = data.filter(bm => isBMFolder(bm));
			
			if (folders.length > 0) {
				// Tabs Aside folder found
				console.log(`'Tabs Aside' folder (${folders[0].id}) found.`);

				return setSessionFolder(folders[0].id).then(refresh);
			} else {
				// Tabs Aside folder not found
				console.log("Creating a new bookmark folder...");
				return createTabsAsideFolder();
			}
		});
	});
}).then(() => {
	updateTabMenus();
}).catch(error => console.log("Error: " + error));

function createTabsAsideFolder() {
	return browser.bookmarks.create({
		title: "Tabs Aside"
	}).then(bm => {
		console.log("Folder successfully created");

		return setSessionFolder(bm.id).then(refresh);
	}).catch(error => console.log("Error: " + error));
}

function asideMessageHandler(message) {
	let promise = Promise.resolve();

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
			promise = Promise.all(
				message.tabs.map(
					tab => addTabToSession(message.sessionID, tab, closeTabs)
				)
			);
		} else {
			// creating a new session

			// custom title?
			let title = (message.title) ? message.title : generateSessionName();

			// tabs aside!
			promise = aside(
				message.tabs,
				closeTabs,
				bookmarkFolderID,
				title
			);
		}

		promise.then(refresh);
	}

	return promise;
}

// message listener
browser.runtime.onMessage.addListener(async message => {
	if (message.command === "aside" || message.command === "save") {
		asideMessageHandler(message);
	} else if (message.command === "updateRoot") {
		setSessionFolder(message.bmID).then(refresh);
	} else if (message.command === "refresh") {
		updateTabMenus();
	} else if (message.command === "ASM") {
		let result = ActiveSessionManager[message.asmcmd].apply(null, message.args || []);

		if (result instanceof Promise) {
			result.then(
				r => browser.runtime.sendMessage({ result: r }),
				e => browser.runtime.sendMessage({ error: e })
			);
		} else {
			browser.runtime.sendMessage({result:result});
		}
	}
});

function refresh() {
	return Promise.all([updateTabMenus(), sendRefresh()]);
}

browser.commands.onCommand.addListener(command => {
	if (command === "tabs-aside") {
		getTabs().then(tabs => {
			return asideMessageHandler({
				command: "aside",
				newtab: !hasAboutNewTab(tabs),
				tabs: tabs.filter(tabFilter)
			});
		}).catch(e => {
			console.error("TA command error: " + e);
		});
		
		// does not currently work in Firefox:
		//browser.sidebarAction.open();
	} else {
		console.log(command);
	}
});