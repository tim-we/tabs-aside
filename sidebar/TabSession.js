const COOLDOWN = 300;
let lastClick = 0;

function allowClick() {
	if (Date.now() - lastClick > COOLDOWN) {
		lastClick = Date.now();
		return true;
	}

	return false;
}

function createProperties(tab) {
	let o = {
		active: false,
		url: tab.url
	};

	if (targetWindowID !== null) {
		o.windowId = targetWindowID;
	}

	return o;
}

class TabSession {
	
		constructor(bm) {
			this.title = bm.title;
			
			this.bmID = bm.id;  // bookmark node ID

			//this.tabs = bm.children.filter(x => x.type === 'bookmark');
			this.tabs = bm.children.filter(x => !!x.url);
	
			this.expanded = false;
	
			// create html structure
			this.html = document.createElement("div");
			this.html.classList.add("session");
			this.html.classList.add('collapsed');
	
			// titlebar
			let titlebar = document.createElement("div");
			titlebar.classList.add("titlebar");
			titlebar.innerHTML = `
				<div class="title">${this.title}</div>
				<div class="counter">${this.tabs.length} tabs</div>`;
			
			this.html.appendChild(titlebar);
			titlebar.title = "click to reveal tabs";
			titlebar.addEventListener("click", () => {
				this.toggle();
			});
			this.titlebar = titlebar;
	
			// control
			let controls = document.createElement("div");
			controls.classList.add("controls");
			this.html.appendChild(controls);

			// restore
			let a = document.createElement("a");
			a.innerText = "Restore tabs";
			a.href = "#";
			a.title = "Restore all tabs from this session";
			a.addEventListener("click", e => {
				e.stopPropagation();
				e.preventDefault();

				if (allowClick()) {

					let _this = this;

					restoreTabsBehavior().then(behavior => {
						let keep = (behavior === "keep");

						// CTRL "inverts" behavior
						if (e.ctrlKey) { keep = !keep; }

						_this.restore(keep);
					});
				}
			});
			controls.appendChild(a);
			
			// edit
			let edit = document.createElement("div");
			edit.classList.add("edit", "button");
			edit.title = "rename session";
			controls.appendChild(edit);
			edit.addEventListener("click", e => {
				e.stopPropagation();

				let title = prompt("Enter session title:", this.title).trim();

				if (title.length > 0) {
					this.title = title;

					browser.bookmarks.update(this.bmID, {
						title: title
					});
				}

			});

			// delete button
			let del = document.createElement("div");
			del.classList.add("delete", "button");
			del.title = "Remove";
			controls.appendChild(del);
			del.addEventListener("click", e => {
				e.stopPropagation();

				if (e.ctrlKey || confirm("Do you really want to delete this session from your bookmarks?")) {
					this.remove();
				}
			});
			
			// tabs
			let tabsOL = this.tabs.reduce((ol, tab) => {
				let li = document.createElement("li");

				let a = document.createElement("a");
				a.classList.add("tab");
				a.href = tab.url;
				let fallBackTitle = (new URL(tab.url)).hostname;
				a.innerText = tab.title || fallBackTitle;
				
				li.appendChild(a);
				ol.appendChild(li);
				return ol;
			}, document.createElement("ol"));

			let tabsection = document.createElement("div");
			tabsection.classList.add("tabs");
			tabsection.appendChild(tabsOL);
			this.html.appendChild(tabsection);
		}
	
		expand() {
			this.expanded = true;
			this.html.classList.add("expanded");
			this.html.classList.remove("collapsed");
			this.titlebar.title = "click to hide tabs";
		}
	
		collapse() {
			this.expanded = false;
			this.html.classList.add("collapsed");
			this.html.classList.remove("expanded");
			this.titlebar.title = "click to reveal tabs";
		}
	
		toggle() {
			if (this.expanded) {
				this.collapse();
			} else {
				this.expand();
			}
		}
	
		restore(keep = false) {
			console.log("restoring tabs from " + this.title);

			if (this.tabs.length > 50) {
				let msg = "Warning:\nOpening this many tabs at once might cause problems on some systems.";
				
				if (!keep) {
					msg += "\n" + "Therefore you will have to manually remove the session after the tabs have been restored.";
				}
				
				alert(msg);

				keep = true;
			}

			let p = Promise.all(
				this.tabs.map(
					tab => browser.tabs.create(createProperties(tab))
				)
			);

			if (!keep) {
				this.collapse();
				
				p = p.then(() => { this.remove(); });
			}

			return p;
		}
	
		remove() {
			this.html.remove();
			this.html = null;

			browser.bookmarks.removeTree(this.bmID).then(() => {
				return browser.runtime.sendMessage({ command: "refresh" });
			});
		}
}

function restoreTabsBehavior() {
	return browser.storage.local.get("restoreBehavior").then(data => {
		return (data.restoreBehavior) ? data.restoreBehavior : "auto-remove";
	}, () => {
		return "auto-remove";
	});
}