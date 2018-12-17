(function () {
	// private variables
	let sessions = [];
	let tabIDs = new Set();
	let expand = false;

	class Session {
		constructor(id,title) {
			this.id = id;
			this.title = title;
		}
		createMenuEntry() {
			let id = this.id, title = this.title;

			let menuEntry = utils.createHTMLElement(
				"div",
				{title:title},
				["button", "complex"],
				title
			);

			let button = utils.createHTMLElement(
				"a",
				{ title: "set tabs from this session aside" },
				["mini-button", "mini-aside-button"]
			);

			button.addEventListener("click", e => {
				externalASMRequest("setSessionAside", [id]);
				browser.sidebarAction.open();
				window.close();
			});

			menuEntry.appendChild(button);

			return menuEntry;
		}
	}

	function createButton(text, tooltip, classes, callback) {
		let btn = document.createElement("a");

		btn.classList.add("button");
		classes.forEach(c => btn.classList.add(c));

		btn.textContent = text;
		btn.title = tooltip;

		if (callback) {
			btn.addEventListener("click", callback);
		}

		return btn;
	}

	function createTitle(title) {
		let elem = document.createElement("div");
		elem.textContent = title;
		elem.classList.add("title");
		return elem;
	}

	function addSeparator() {
		let d = document.createElement("div");
		d.classList.add("menu-divider");
		document.body.appendChild(d);
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

	function getActiveSessionData() {
		return externalASMRequest("getActiveSessionData", []).then(sessionData => {
			if (sessionData) {
				sessionData.tabs.forEach(tab => tabIDs.add(tab));

				return Promise.all(
					sessionData.sessions.map(sID => {
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

	function tabsAside(cmd, tabs) {
		// send the tabs aside command
		return browser.runtime.sendMessage({
			command: cmd,
			newtab: cmd==="aside" && sessions.length === 0 && !utils.containsEmptyTab(tabs),
			tabs: tabs
		}).catch(error => console.log("Error: " + error));
	}

	// init routine
	(function () {
		Promise.all([
			loadConfig(),
			getActiveSessionData(),
			utils.getTabs({currentWindow:true})
		]).then(data => {
			// tabs in current window that are not in a (active) session
			let remainingTabs = data[2].filter(
				tab => !tabIDs.has(tab.id) && utils.urlFilter(tab.url)
			);

			if (expand) {
				document.body.classList.add("expanded");
			}

			sessions.forEach(s => {
				document.body.appendChild(s.createMenuEntry());

				addSeparator();
			});

			document.body.appendChild(createButton("show sessions", "open the sidebar", ["session-btn", "shortcut"], e => {
				browser.sidebarAction.open();
				window.close();
			}));

			// are there remaining tabs?
			if (remainingTabs.length > 0) {
				let description = (sessions.length > 0) ?
					"set aside tabs that are not associated with any session" :
					"close all tabs & store them in your bookmarks";

				document.body.appendChild(createButton("tabs aside", description, ["aside", "shortcut"], e => {
					tabsAside("aside", remainingTabs);
					browser.sidebarAction.open();
					window.close();
				}));

				document.body.appendChild(createButton("save tabs", "save all tabs (does not close tabs)", ["extended", "save-btn"], e => {
					tabsAside("save", remainingTabs);
					browser.sidebarAction.open();
					window.close();
				}));

				let selectBtn = createButton("select tabs", "select tabs to set aside", ["extended", "select-btn"]);
				selectBtn.href = "selector.html";
				document.body.appendChild(selectBtn);

				if (!expand) {
					let moreBtn = createButton("more options", "expand menu & show more options", ["more-btn"], e => {
						moreBtn.remove();
						document.body.classList.add("expanded");
					});

					document.body.appendChild(moreBtn);
				}
			}
		}).catch(e => {
			alert("There was an unexpeted error.\nSee the console (Ctrl+Shift+J) for details.");
			window.close();
		});
	})();
})();