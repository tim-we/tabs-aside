(function () {
	// private variables
	let sessions = [];
	let expand = false;

	class Session {
		constructor(id,title) {
			this.id = id;

			this.container = document.createElement("div");
			this.container.classList.add("session-container");

			this.container.appendChild(createTitle(title));

			this.container.appendChild(createButton(
				"set aside",
				"set the session aside (closes all it's tabs)",
				["aside"],
				e => {
					externalASMRequest("setSessionAside", [id]);
					browser.sidebarAction.open();
					window.close();
				}
			));
		}
	}

	function createButton(text, tooltip, classes, callback) {
		let btn = document.createElement("a");

		btn.classList.add("button");
		classes.forEach(c => btn.classList.add(c));

		btn.innerText = text;
		btn.title = tooltip;

		if (callback) {
			btn.addEventListener("click", callback);
		}

		return btn;
	}

	function createTitle(title) {
		let elem = document.createElement("div");
		elem.innerText = title;
		elem.classList.add("title");
		return elem;
	}

	function loadConfig() {
		return new Promise(resolve => {
			if (location.hash.replace("#", "").trim() === "expand") {
				expand = true;
				resolve();
			} else {
				return browser.storage.local.get("expand-menu").then(data => {
					expand = (data["expand-menu"] !== undefined) ? data["expand-menu"] : false;
					resolve();
				});
			}
		});
	}

	function getActiveSessions() {
		return externalASMRequest("getActiveSessionIDs",[],0).then(sessionIDs => {
			if (sessionIDs instanceof Array) {
				return Promise.all(
					sessionIDs.map(sID => {
						return browser.bookmarks.get(sID).then(bms => {
							if (bms.length === 1) {
								sessions.push(new Session(sID, bms[0].title));
							}
						});
					})
				);
			} else {
				return Promise.reject("unexpected response");
			}
		}).catch(e => {
			console.error("[TA] ASM.getActiveSessions: " + e);
		});
	}

	function tabsAside(cmd) {
		return getTabs().then(tabs => {
			// tabs aside!
			return browser.runtime.sendMessage({
				command: cmd,
				newtab: cmd==="aside" && !hasAboutNewTab(tabs),
				tabs: tabs.filter(tabFilter)
			}).catch(error => console.log("Error: " + error));
		});
	}

	// init routine
	(function () {
		Promise.all([
			loadConfig(),
			getActiveSessions()
		]).then(data => {

			if (expand) {
				document.body.classList.add("expanded");
			}

			if (sessions.length > 0) {
				document.body.classList.add("active-sessions");

				sessions.forEach(s => document.body.appendChild(s.container));
			}

			if (/*there are remaining tabs*/true) {
				let rc = document.createElement("div");
				rc.classList.add("session-container");
				document.body.appendChild(rc);
				
				if (sessions.length > 0) {
					rc.appendChild(createTitle("Remaining tabs"));
				}

				rc.appendChild(createButton("tabs aside", "close all tabs &amp; store them in your bookmarks", ["aside"], e => {
					tabsAside("aside");
					browser.sidebarAction.open();
					window.close();
				}));

				rc.appendChild(createButton("save tabs", "save all tabs (does not close tabs)", ["extended", "save-btn"], e => {
					tabsAside("save");
					browser.sidebarAction.open();
					window.close();
				}));

				let selectBtn = createButton("select tabs", "select tabs to set aside", ["extended", "select-btn"]);
				selectBtn.href = "selector.html";
				rc.appendChild(selectBtn);

				if (!expand) {
					let moreBtn = createButton("more options", "expand menu &amp; show more options", ["more-btn"], e => {
						moreBtn.remove();
						document.body.classList.add("extended");
					});

					document.body.appendChild(moreBtn);
				}
			}

			document.body.appendChild(createButton("show sessions", "opens the sidebar", ["session-btn"], e => {
				browser.sidebarAction.open();
			}));
		}).catch(e => {
			alert("There was an unexpeted error.\nSee the console (Ctrl+Shift+J) for details.");
			window.close();
		});
	})();
})();