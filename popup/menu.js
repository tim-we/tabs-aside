(function () {
	// private variables
	let buttons = [];
	let expand = false;

	function addButton(domID, text, tooltip, advanced, callback) {
		let btn = document.createElement("a");
		btn.classList.add("button");
		if (advanced) { btn.classList.add("extended"); }
		btn.innerText = text;
		btn.title = tooltip;
		btn.id = domID;

		if (callback) {
			btn.addEventListener("click", callback);
		}

		buttons.push(btn);
		document.body.appendChild(btn);

		return btn;
	}

	function config() {
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

	function getTabInfo() {
		return browser.tabs.query({
			active: true,
			currentWindow: true
		}).then(tabs => {
			if (tabs.length === 1) {
				let tab = tabs[0];

				return tab;
			} else {
				return Promise.reject(new Error(`Query returned ${tabs.length} results.`));
			}
		}).then(tab => {
			return externalASMRequest("getActiveSessionID", tab.id).then(response => {
				if (response.sessionID !== undefined) {
					tab.sessionID = response.sessionID;
					return Promise.resolve(tab);
				} else {
					return Promise.reject("unexpected response");
				}
			});
		});
	}

	// init routine
	(function () {
		Promise.all([
			config(),
			getTabInfo()
		]).then(data => {
			let tab = data[1];

			if (expand) {
				document.body.classList.add("expanded");
			}

			if (tab.sessionID) {
				addButton("close-session", "close session", "close tabs from this session (the session will be kept)", false, e => {
					
				});

				addButton("new-session", "new session", "creates a new session with all the current tabs", true, );
			} else {
				addButton("aside-btn", "tabs aside", "close all tabs &amp; store them in your bookmarks", false, e => {
					
				});

				addButton("save-btn", "save tabs", "save all tabs (does not close tabs)", true, e => {
					
				});
			}

			let selectBtn = addButton("select-btn", "select tabs", "select tabs to set aside", true);
			selectBtn.href = "selector.html";

			if (!expand) {
				let moreBtn = addButton("more-btn", "more options", "expand menu &amp; show more options", false, e => {
					let i = buttons.indexOf(moreBtn);
					buttons.splice(i, 1);
					moreBtn.remove();
					document.body.classList.add("extended");
				});
			}

			addButton("session-btn", "show sessions", "opens the sidebar", false, e => {
				browser.sidebarAction.open();
			});
		});
	})();
})();