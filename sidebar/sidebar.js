const FOLDERNAME = "Tabs Aside";
const BMPREFIX = "Session #";

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
	return new Promise((resolve, reject) => {
		// load root bookmark folder (Tabs Aside folder)
		browser.bookmarks.getTree().then(data => {
			let root = data[0];
		
			for (rbm of root.children) {
				for (bm of rbm.children) {
					if (bm.title === FOLDERNAME && isBMFolder(bm)) {
						bookmarkFolder = bm;

						resolve(bm);
						return;
					}
				}
			}
			
			reject("Tabs Aside root bookmark folder not found");
		}, reject);
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