const FOLDERNAME = "Tabs Aside";
const BMPREFIX = "Session #";

var session = -1;
var bookmarkFolder = null;

// load session index
browser.storage.local.get("session").then(data => {
	if (data.session) {
		session = data.session;
	} else {
		session = 0;

		browser.storage.local.set({
			session: session
		});
	}
}, onRejected);

// load root bookmark folder (Tabs Aside folder)
browser.bookmarks.getTree().then(data => {
	let root = data[0];

	console.log("searching for Tabs Aside folder");

	// search for root folder
	if (!root.children.some(rbm => {
		return rbm.children.some(bm => {
			if (bm.title === FOLDERNAME && isBMFolder(bm)) {
				bookmarkFolder = bm;

				// folder found
				return true;
			}
		});
	})) {
		// root folder not found

		console.log("Folder not found, lets create it!");
		
		browser.bookmarks.create({
			title: FOLDERNAME
		}).then(bm => {
			console.log("Folder successfully created");

			bookmarkFolder = bm;

			setTimeout(sendRefresh, 42);
		}, onRejected);
	}
}, onRejected);

function titleGenerator() {
	session++;

	// update storage
	browser.storage.local.set({
		session: session
	});

	return BMPREFIX + session;
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
				titleGenerator()
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
			let title = (message.title) ? message.title : titleGenerator();

			// tabs aside!
			aside(
				message.tabs,
				closeTabs,
				bookmarkFolder.id,
				title
			);
		}
	} else if (message.command === "tab-to-session") {
		addTabToSession(message.sessionFID, message.tab, true);
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