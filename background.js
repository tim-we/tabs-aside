const FOLDERNAME = "Tabs Aside";
const BMPREFIX = "Session #";

var session = -1;
var bookmarkFolder = null;

// basic error handler
function onRejected(error) {
	console.log(`An error: ${error}`);
}

// tmp bookmark API fix
function isBMFolder(bm) {
	return bm.type === "folder" || !bm.url;
}

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

	outerloop: for (rbm of root.children) {
		for (bm of rbm.children) {
			if (bm.title === FOLDERNAME && isBMFolder(bm)) {
			bookmarkFolder = bm;
			// Folder found
			break outerloop;
			}
		}
	}

	// Tabs Aside folder wasnt found
	if (bookmarkFolder === null) {
		console.log("Folder not found, lets create it!");

		browser.bookmarks.create({
			title: FOLDERNAME
		}).then(bm => {
			console.log("Folder successfully created");

			bookmarkFolder = bm;

			setTimeout(refresh, 42);
		}, onRejected);
	}
}, onRejected);

// tab filter function
function tabFilter(tab) {
	let url = tab.url;

	// only http(s), file and view-source
	return url.indexOf("http") === 0 || url.indexOf("view-source:") === 0;
}

// sets the tabs aside (returns a promise)
function aside(tabs, closeTabs) {
	// this sessions bookmark folder id
	var pID = null;

	// a function that closes & stores the tabs one by one recursively
	function asideOne() {
		// get the first tab & remove it fram tab array
		let tab = tabs.shift();

		// create bookmark (& return this promise chain)
		return browser.bookmarks.create({
			parentId: pID,
			title: tab.title,
			url: tab.url
	}).then(() => {
			// close tab or skip (return resolved promise)
			return closeTabs ? browser.tabs.remove(tab.id) : Promise.resolve();
		}).then(() => {
			return tabs.length > 0 ? asideOne() : Promise.resolve();
		});
	}

	if (tabs.length > 0) {
		session++;

		// create session bm folder (& return promise chain)
		return browser.bookmarks.create({
			parentId: bookmarkFolder.id,
			title: BMPREFIX + session
		}).then(bm => {
			pID = bm.id;

			// update storage
			browser.storage.local.set({
				session: session
			});

			// move tabs aside one by one
			return asideOne(tabs, bm.id, closeTabs);
		}).then(() => {
			return refresh();
		}).catch(onRejected);
	
	} else {
		return refresh();
	}
}

function hasAboutNewTab(tabs) {
	for (let i = 0; i < tabs.length; i++) {
		if (tabs[i].url === "about:newtab") {
			return true;
		}
	}

	return false;
}

// message listener
browser.runtime.onMessage.addListener(message => {
	if (message.command === "aside") {

		var closeTabs = !message.save;

		browser.tabs.query({
			currentWindow: true,
			pinned: false
		}).then((tabs) => {
			if (closeTabs && !hasAboutNewTab(tabs)) {
				// open a new empty tab (async)
				browser.tabs.create({});
			}

			// tabs aside!
			return aside(tabs.filter(tabFilter), closeTabs);
		}).catch(onRejected);
	
	} else if (message.command === "refresh") {
		// don't do anything...
	} else {
		console.error("Unknown message: " + JSON.stringify(message));
	}
});

function refresh() {
	return browser.runtime.sendMessage({ command: "refresh" });
}