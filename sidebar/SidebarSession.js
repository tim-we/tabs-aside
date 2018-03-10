const TAB_LOADER_PREFIX = browser.extension.getURL("tab-loader/load.html") + "?";

class SidebarSession {

	constructor(bmID, active=false, expand=false, rename=false) {
		this.title = bmID;
		this.sessionID = bmID; // bookmark node ID

		this.editCancelCallback = null;

		// create html structure
		this.html = utils.createHTMLElement("div", {}, ["session", "collapsed"]);
		this.html.addEventListener("click", e => e.stopPropagation());

		// state
		this.expanded = expand;
		this.setState("closed");

		// titlebar
		let titlebar = this.titlebar = utils.createHTMLElement("div", {
			"title": "click to reveal tabs"
		}, ["titlebar"]);
		this.titleElement = utils.createHTMLElement("span", {title:this.title}, ["title"], this.title);
		this.counterElement = utils.createHTMLElement("span", {}, ["counter"], `- tabs`);
		[this.titleElement, this.counterElement].forEach(i => titlebar.appendChild(i));
		
		titlebar.addEventListener("click", () => { this.toggle(); });
		this.titleElement.addEventListener("click", e => {
			e.stopPropagation();

			this.rename();

		});
		this.html.appendChild(titlebar);

		// control
		let controls = utils.createHTMLElement("div", {}, ["controls"]);
		titlebar.appendChild(controls);

		// restore button
		let rb = utils.createHTMLElement("a", {
			title: "Restore all tabs from this session"
		}, ["session-restore-button"],
			"Restore tabs"
		);
		rb.addEventListener("click", e => {
			e.stopPropagation();
			this.restore();
		});
		controls.appendChild(rb);

		// set aside button
		let sab = utils.createHTMLElement("a", {
			title: "close tabs from this session"
		}, ["session-aside-button"],
			"Set aside"
		);
		sab.addEventListener("click", e => {
			e.stopPropagation();
			this.setAside();
		});
		controls.appendChild(sab);

		// more button
		let more = utils.createHTMLElement("div", {
			"title": "more"
		}, ["more-button"]);
		controls.appendChild(more);
		more.addEventListener("click", e => {
			e.stopPropagation();

			new SessionOptionsMenu(this, e.clientX, e.clientY);
		}, true);
		
		// tab section
		this.tabsection = document.createElement("div");
		this.tabsection.classList.add("tabs");
		this.html.appendChild(this.tabsection);

		let promise = this.update();

		if(document.hasFocus() && rename) {
			let session = this;
			promise.then(() => session.rename());
		}

		if(active) {
			this.setState("active");
		}
	}

	setState(newState) {
		if (this.state) { this.html.classList.remove(this.state); }
		this.state = newState;
		this.html.classList.add(newState);
	}

	update() {
		return Promise.all([
			this.cancelEdits()
			.then(() => browser.bookmarks.get(this.sessionID))
			.then(bms => {
				let bm = bms[0];
				this.title = bm.title;
				this.titleElement.title = bm.title;
				this.titleElement.textContent = bm.title;
			}),

			this._loadTabsFromBookmarks().then(ts => {
				this.counterElement.textContent = `${ts.length} tabs`;

				if (this.expanded) {
					return this._generateTabHTML(ts);
				}
			})
		]);
	}

	expand() {
		this.expanded = true;
		this.html.classList.add("expanded");
		this.html.classList.remove("collapsed");
		this.titlebar.title = "click to hide tabs";

		this._generateTabHTML();
	}

	collapse() {
		this.expanded = false;
		this.html.classList.add("collapsed");
		this.html.classList.remove("expanded");
		this.titlebar.title = "click to reveal tabs";

		this.tabsection.innerHTML = "";
	}

	toggle() {
		if (this.expanded) {
			this.collapse();
		} else {
			this.expand();
		}
	}

	/**
	 * restores a session by calling ActiveSessionManager.restoreSession
	 * @param {boolean} newWindow open tabs in a new window?
	 * @returns {Promise} the ASM Request promise
	 */
	restore(newWindow = false) {
		if (this.state !== "closed") { return Promise.reject(); }

		console.log(`restoring tabs from "${this.title}"`);
		this.setState("restoring");
		
		return externalASMRequest("restoreSession", [this.sessionID, newWindow]).then(() => {
			this.setState("active");
		});
	}

	/**
	 * deletes a session (from the bookmarks & the sidebar html element)
	 * @param {boolean} keepOpenTabs if the session has open tabs (is active), keep them?
	 * @returns {Promise} a promise
	 */
	remove(keepOpenTabs = false) {
		let session = this;

		let p = keepOpenTabs ?
					// free tabs from session (remove session keys etc...)
					externalASMRequest("freeTabs", [this.sessionID]) :
					// active tabs will be closed
					this.setAside();

		return p.then(() => {
			// remove from sidebar
			session.removeHTML();

			// remove from bookmarks
			return browser.bookmarks.removeTree(session.sessionID).then(() => {
				return sendRefresh();
			});
		});
	}

	/** removes this sessions' html element (removes it from the sidebar) */
	removeHTML() {
		this.html.remove();
		this.html = null;
	}

	/** updates the sessions title in the html view and the bookmarks */
	updateTitle(newTitle) {
		if (newTitle.length > 0) {
			this.title = newTitle;
			this.titleElement.title = newTitle;

			return browser.bookmarks.update(this.sessionID, {
				title: newTitle
			}).then(() => {
				this.titleElement.textContent = newTitle;
				return sendRefresh();
			}, e => {
				alert(`Title was not updated: ${e}`);
			});
		} else {
			return Promise.reject("invalid title");
		}
	}

	/**
	 * Activates the rename mode.
	 * Replaces the title element with text input field.
	 * @returns {Promise} a promise that is fulfilled after the edits are completed
	*/
	rename() {
		// create input element
		let input = document.createElement("input");
			input.type = "text";
			input.placeholder = "enter title";
			input.classList.add("title");
			input.title = "";
			input.value = this.title;
			input.style.width = (this.titleElement.offsetWidth + 4) + "px";
		
		// catch clicks (prevents collapsing/expanding of session)
		input.addEventListener("click", e => e.stopPropagation());
		
		let titleElement;
		let session = this;
		let abort = false;
		
		// Promise resolves when user input is "completed"
		let p = new Promise((resolve, reject) => {
			// handle focus loss
			function blurListener(e) {
				e.stopPropagation();
				resolve();
			}
			
			// ENTER -> submit changes, ESC -> abort
			function keyListener(e) {
				e.stopPropagation();
				if (e.keyCode === 13) { // ENTER
					resolve();
				} else if (e.keyCode === 27) { // ESC
					abort = true;
					resolve();
				}
			}

			// cancel edits API
			session.editCancelCallback = function () {
				abort = true;
				resolve();
				return p;
			}

			// replace title with input element
			titleElement = this.titlebar.replaceChild(input, this.titleElement);
			input.focus();
			input.addEventListener("blur", blurListener);
			input.addEventListener("keydown", keyListener);
			input.select();
		}).then(() => {
			let newTitle = input.value.trim();

			this.titlebar.replaceChild(titleElement, input);
			session.editCancelCallback = null;

			if (!abort && newTitle && newTitle !== session.title) {
				session.updateTitle(newTitle);
			}
		});

		return p;
	}

	cancelEdits() {
		return this.editCancelCallback ? this.editCancelCallback() : Promise.resolve();
	}

	isActive() {
		return this.state === "active";
	}

	/**
	 * sets the session aside
	 * @returns {Promise} an ASM request promise
	*/
	setAside() {
		if (this.isActive()) {
			this.setState("closing");

			return externalASMRequest("setSessionAside", [this.sessionID]).then(() => {
				this.setState("closed");
				this.expand();
			});
		} else {
			return Promise.resolve();
		}
	}

	_loadTabsFromBookmarks() {
		return browser.bookmarks.getChildren(this.sessionID).then(
			bms => bms.filter(x => !!x.url)
		);
	}

	_generateTabHTML(bmData) {
		let promise = (bmData instanceof Array) ?
			Promise.resolve(bmData) :
			this._loadTabsFromBookmarks();
		
		let session = this;

		return promise.then(bms => {
			let tabsOL = bms.reduce((ol, tab) => {
				let li = document.createElement("li");

				let a = document.createElement("a");
				a.classList.add("tab");
				a.href = tab.url;
				a.addEventListener("click", e => {
					e.stopPropagation();
					e.preventDefault();

					// TODO: open session (partially)
				});
				a.addEventListener("contextmenu", e => {
					e.stopImmediatePropagation();
					e.preventDefault();

					new SessionLinkContextMenu(session, tab, e.clientX, e.clientY);
				});

				let title = tab.title;

				if(tab.title) {
					if(tab.title.length > 9 && tab.title.substr(0, 9) === "[pinned] ") {
						tab.pinned = true;
						tab.title = title = tab.title.substr(9);
						a.classList.add("pinned");
					}
				} else {
					title = (new URL(tab.url)).hostname + " [no title]";
					tab.pinned = false;
				}

				a.textContent = title;
				
				li.appendChild(a);
				ol.appendChild(li);
				return ol;
			}, document.createElement("ol"));

			this.tabsection.innerHTML = "";
			this.tabsection.appendChild(tabsOL);
		});
	}
}