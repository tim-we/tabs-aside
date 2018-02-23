let bookmarkFolder = null;
let list = document.getElementById("list");
let emptyMsg = document.getElementById("empty-msg")
let sessions = new Map(); // maps session IDs to SidebarSession objects

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

function init() {
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
			// add to sessions map
			data.forEach(s => sessions.set(s.sessionID, s));
	
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

window.addEventListener("load", init);

browser.runtime.onMessage.addListener(message => {
	if(message.command === "session-update") {
		let t = message.type;
		let sessionID = message.sessionID;

		if(t === "session-updated") {
			sessions.get(sessionID).update();
		} else if(t === "session-closed") {
			sessions.get(sessionID).setState("closed");
		} else if(t === "session-created") {
			session.set(sessionID, new SidebarSession(sessionID, true, false));
		} else if(t === "session-removed") {
			sessions.get(sessionID).removeHTML();
			sessions.delete(sessionID);
		}
	}
});