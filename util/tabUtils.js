// returns a promise
function getTabs() {
	return browser.storage.local.get("ignore-pinned").then(data => {
		let options = {
			currentWindow: true
		};

		let ignorePinned = (data["ignore-pinned"] === undefined) ? true : data["ignore-pinned"];

		if(ignorePinned) {
			options.pinned = false;
		}

		return options;
	}).then(filter => browser.tabs.query(filter));
}

// tab filter function
function tabFilter(tab) {
	let url = tab.url;

	// only http(s), file and view-source
	return url.startsWith("http") || url.startsWith("view-source:");
}

function urlFilter(url) {
	// only http(s), file and view-source
	return url.startsWith("http") || url.startsWith("view-source:");
}

function hasAboutNewTab(tabs) {
	return tabs.some(tab => tab.url === "about:newtab");
}

function makeTitle(title, pinned=false) {
	return pinned ? "[pinned] " + title : title;
}