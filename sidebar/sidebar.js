let bookmarkFolder = null;
let list = document.getElementById("list");
let emptyMsg = document.getElementById("empty-msg")
let sessions = [];

// parse url
var targetWindowID = null;

let params = (new URL(location.href)).searchParams;

// basic error handler
function onRejected(error) {
	console.log(`An error: ${error}`);
}

function loadBMRoot() {
	return getSessionRootFolder().then(folder => {
		if (folder === null) {
			return Promise.reject("Tabs Aside root bookmark folder not found");
		} else {
			return browser.bookmarks.getSubTree(folder.id).then(data => {
				bookmarkFolder = data[0];
				return data[0];
			});
		}
	});
}

function getTabSessions() {
	return new Promise(resolve => {
		let sessions = bookmarkFolder.children
			.filter(isBMFolder)
			.map(bm => new TabSession(bm))
			.reverse();

		resolve(sessions);
	});
}

function refresh(close = false) {
	loadBMRoot().then(getTabSessions).then(data => {
		sessions = data;

		list.innerHTML = "";
		emptyMsg.classList.remove("show");

		sessions.forEach((session, index) => {
			list.appendChild(session.html);

			// auto expand last session
			if (index === 0) {
				session.expand();
			}
		});

		if (sessions.length === 0) {
			emptyMsg.classList.add("show");
		}
	}).catch(onRejected);
}

window.addEventListener("load", () => {
	refresh();
});

browser.runtime.onMessage.addListener(message => {
	if (message.command === "refresh") {
		refresh(true);
	}
});

browser.bookmarks.onChanged.addListener(() => {
	refresh(true);
});