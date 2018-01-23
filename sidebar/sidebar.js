let bookmarkFolder = null;
let list = document.getElementById("list");
let emptyMsg = document.getElementById("empty-msg")
let sessions = [];

// parse url
var targetWindowID = null;

let params = (new URL(location.href)).searchParams;

function loadBMRoot() {
	return getSessionRootFolder().then(folder => {
		return (bookmarkFolder = folder);
	}, e => {
		// wait 0.2s and try again
		console.log(e);
		return wait(200).then(loadBMRoot);
	});
}

function getTabSessions() {
	return new Promise(resolve => {
		let sessions = getSessions(bookmarkFolder)
			.map(bm => new TabSession(bm))
			.reverse();

		resolve(sessions);
	});
}

function update(close = false) {
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
	}).catch(error => console.log("Error: " + error));
}

window.addEventListener("load", () => {
	update();
});

browser.runtime.onMessage.addListener(message => {
	if (message.command === "refresh") {
		update(true);
	}
});