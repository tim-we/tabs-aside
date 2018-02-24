let bookmarkFolder = null;
let list = document.getElementById("list");
let emptyMsg = document.getElementById("empty-msg")
let sessions = new Map(); // maps session IDs to SidebarSession objects

let params = (new URL(location.href)).searchParams;

function loadBMRoot() {
	return getSessionRootFolder().then(folder => {
		return (bookmarkFolder = folder);
	}, e => {
		// wait 0.2s and try again
		console.log("[TA] " + e);
		return utils.wait(200).then(loadBMRoot);
	});
}

function getTabSessions(activeSessions) {
	return new Promise(resolve => {
		let sessions = getSessions(bookmarkFolder)
			.map(bm => new SidebarSession(
				bm.id,
				// is session with id bm.id active?
				activeSessions.includes(bm.id)
			))
			.reverse();

		resolve(sessions);
	});
}

(function(){
	// initialization

	// this function will be called on every session to set the expand state
	// might be changed (based on preferences)
	let setExpandState = function (session, index) {
		// auto expand latest session
		if (index === 0) {
			session.expand();
		}
	};

	Promise.all([
		utils.waitUntilPageIsLoaded(),

		// load user config for default session expand behavior
		browser.storage.local.get("sbSessionDefaultState").then(data => {
			if (data.sbSessionDefaultState) {
				if (data.sbSessionDefaultState === "expand-all") {
					setExpandState = function (session) { session.expand(); };
				} else if (data.sbSessionDefaultState === "collapse-all") {
					// sessions are collapsed by default, therefore nothing to do
					setExpandState = function (session) { /*no-op*/ };
				}
			}
		}),

		loadBMRoot(),

		externalASMRequest("getActiveSessionData", [])
	]).then(initData => {
		let activeSessionData = initData[3];

		getTabSessions(activeSessionData.sessions).then(data => {
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
	}).catch(error => console.error("[TA] Error: " + error));
})();

browser.runtime.onMessage.addListener(message => {
	if(message.command === "session-update") {
		let t = message.type;
		let sessionID = message.sessionID;

		if(t === "session-updated") {
			sessions.get(sessionID).update();
		} else if(t === "session-closed") {
			sessions.get(sessionID).setState("closed");
		} else if(t === "session-created") {
			session.set(sessionID, new SidebarSession(sessionID, false, true));
		} else if(t === "session-removed") {
			sessions.get(sessionID).removeHTML();
			sessions.delete(sessionID);
		}
	}
});