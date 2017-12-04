// basic error handler
function onRejected(error) {
	console.log(`An error: ${error}`);
}

// sets the tabs aside (returns a promise)
function aside(tabs, closeTabs, parentBookmarkID, sessionTitle) {
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
		// create session bm folder (& return promise chain)
		return browser.bookmarks.create({
			parentId: parentBookmarkID,
			title: sessionTitle
		}).then(bm => {
			pID = bm.id;

			// move tabs aside one by one
			return asideOne(tabs, bm.id, closeTabs);
		}).then(refresh)
		  .catch(onRejected);
	
	} else {
		return refresh();
	}
}

// returns a promise
function getTabs() {
	return browser.tabs.query({
		currentWindow: true,
		pinned: false
	});
}

// tab filter function
function tabFilter(tab) {
	let url = tab.url;

	// only http(s), file and view-source
	return url.indexOf("http") === 0 || url.indexOf("view-source:") === 0;
}

function hasAboutNewTab(tabs) {
	return tabs.some(tab => tab.url === "about:newtab");
}

function refresh() {
	return browser.runtime.sendMessage({ command: "refresh" });
}