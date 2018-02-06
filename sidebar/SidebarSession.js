const TAB_LOADER_PREFIX = browser.extension.getURL("tab-loader/load.html") + "?";

class SidebarSession {
	
	constructor(bmID, expand=false, active=false) {
		this.title = bmID;
		this.sessionID = bmID; // bookmark node ID

		this.expanded = expand;
		this.state = "closed";

		// create html structure
		this.html = utils.createHTMLElement("div", {}, ["session", "collapsed"]);
		this.html.addEventListener("click", e => e.stopPropagation());

		// titlebar
		let titlebar = utils.createHTMLElement("div", {
			"title": "click to reveal tabs"
		}, ["titlebar"]);
		this.titleElement = utils.createHTMLElement("span", {}, ["title"], this.title);
		this.counterElement = utils.createHTMLElement("span", {}, ["counter"], `- tabs`);
		[this.titleElement, this.counterElement].forEach(i => titlebar.appendChild(i));
		
		titlebar.addEventListener("click", () => {
			this.toggle();
		});
		this.titlebar = titlebar;
		this.titleElement.addEventListener("click", e => e.stopPropagation());
		this.titleElement.addEventListener("dblclick", e => {
			e.stopPropagation();

			let title = prompt("Enter session title:", this.title);

			if (title && title.trim()) {
				this.changeTitle(title.trim());
			}

		});
		this.html.appendChild(titlebar);

		// control
		let controls = utils.createHTMLElement("div", {}, ["controls"]);
		this.titlebar.appendChild(controls);

		// restore
		let a = document.createElement("a");
		a.textContent = "Restore tabs";
		a.href = "#";
		a.title = "Restore all tabs from this session";
		a.addEventListener("click", e => {
			e.stopPropagation();
			e.preventDefault();

			if (this.state !== "closed") { return; }

			this.restore();
		});
		controls.appendChild(a);

		// more button
		let more = utils.createHTMLElement("div", {
			"title": "more"
		}, ["more-button"]);
		controls.appendChild(more);
		more.addEventListener("click", e => {
			e.stopPropagation();

			SCM.show(this, e.clientX, e.clientY);
		}, true);
		
		// tab section
		this.tabsection = document.createElement("div");
		this.tabsection.classList.add("tabs");
		this.html.appendChild(this.tabsection);

		this.update();
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

		return promise.then(bms => {
			let tabsOL = bms.reduce((ol, tab) => {
				let li = document.createElement("li");

				let a = document.createElement("a");
				a.classList.add("tab");
				a.href = tab.url;
				a.addEventListener("click", e => e.stopPropagation());

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

	update() {
		browser.bookmarks.get(this.sessionID).then(bms => {
			let bm = bms[0];
			this.title = bm.title;
			this.titleElement.textContent = bm.title;
		});

		this._loadTabsFromBookmarks().then(ts => {
			this.counterElement.textContent = `${ts.length} tabs`;

			if (this.expanded) {
				this._generateTabHTML(ts);
			}
		});
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

	restore(newWindow = false) {
		console.log("restoring tabs from " + this.title);
		this.collapse();
		this.state = "restoring";
		externalASMRequest("restoreSession", [this.sessionID, newWindow]).then(() => {
			this.state = "active";
		});
	}

	remove() {
		this.html.remove();
		this.html = null;

		browser.bookmarks.removeTree(this.sessionID).then(() => {
			return sendRefresh();
		});
	}

	changeTitle(newTitle) {
		if (newTitle.length > 0) {
			this.title = newTitle;

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

	isActive() {
		return this.state === "active";
	}

	setAside() {
		if (this.isActive()) {
			this.state = "closing";

			externalASMRequest("setSessionAside", [this.sessionID]).then(() => {
				this.state = "closed";
				this.expand();
			});
		}
	}
}