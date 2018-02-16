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
		return utils.wait(200).then(loadBMRoot);
	});
}

function getTabSessions() {
	return new Promise(resolve => {
		let sessions = getSessions(bookmarkFolder)
			.map(bm => new SidebarSession(bm.id))
			.reverse();

		resolve(sessions);
	});
}

function update(close = false) {
	let setExpandState = function (session, index) {
		// auto expand last session
		if (index === 0) {
			session.expand();
		}
	};

	return browser.storage.local.get("sbSessionDefaultState").then(data => {
		if (data.sbSessionDefaultState) {
			if (data.sbSessionDefaultState === "expand-all") {
				setExpandState = function (session) { session.expand(); };
			} else if (data.sbSessionDefaultState === "collapse-all") {
				// default state, therefore nothing to do
				setExpandState = function (session) { /*no-op*/ };
			}
		}
	}).then(() => {
		return loadBMRoot().then(getTabSessions).then(data => {
			sessions = data;
	
			list.innerHTML = "";
			emptyMsg.classList.remove("show");
	
			sessions.forEach((session, index) => {
				list.appendChild(session.html);
	
				setExpandState(session, index);
			});
	
			if (sessions.length === 0) {
				emptyMsg.classList.add("show");
			}
		});
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

/*document.addEventListener('keydown', (event) => {
	if (event.repeat) { return; }
	const keyName = event.key;

	let keys = [];

	if (event.ctrlKey) {
		keys.push("Ctrl");
	}

	if (event.altKey) {
		keys.push("Alt");
	}

	keys.push(event.key);

	console.log(keys.join(",") + " pressed");
	
});*/