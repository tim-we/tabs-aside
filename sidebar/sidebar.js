const FOLDERNAME = "Tabs Aside";
const BMPREFIX = "Session #";
const COOLDOWN = 500;

let bookmarkFolder = null;
let list = document.getElementById("list");
let lastRestore = 0;
let sessions = [];

function clipText(text, maxlength) {
	if (text.length <= maxlength) {
		return text;
	} else {
		return text.substr(0, maxlength - 3) + "...";
	}
}

function allowRestore() {
	if (Date.now() - lastRestore > COOLDOWN) {
		lastRestore = Date.now();
		return true;
	}

	return false;
}

class TabSession {

	constructor(bm) {
		this.title = bm.title;

		this.tabs = bm.children.filter(x => x.type === 'bookmark');

		this.expanded = false;

		// create html structure
		let tabhtml = this.tabs.map(
			tab => `<li>${clipText(tab.title || tab.url, 42)}</li>`
		).join("\n");

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

		let a = document.createElement("a");
		a.innerText = "Restore tabs";
		a.href = "#";
		a.title = "Restore all tabs from this session";
		a.addEventListener("click", e => {
			e.stopPropagation();

			if (allowRestore()) {
				this.restore();
			}
		});
		controls.appendChild(a);

		this.html.appendChild(controls);
		
		// tabs
		let tabsection = document.createElement("div");
		tabsection.classList.add("tabs");
		tabsection.innerHTML = `
			<div class="tabs">
				<ol>
					${tabhtml}
				</ol>
			</div>`;
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

	restore() {
		console.log("restoring tabs from " + this.title);

		this.collapse();

		return Promise.all(this.tabs.map(tab => browser.tabs.create({
			url: tab.url
		})));
	}
}

// basic error handler
function onRejected(error) {
	console.log(`An error: ${error}`);
}

function loadBMRoot() {
	return new Promise((resolve, reject) => {
		// load root bookmark folder (Tabs Aside folder)
		browser.bookmarks.getTree().then(data => {
			let root = data[0];
		
			outerloop: for (rbm of root.children) {
				for (bm of rbm.children) {
					if (bm.title === FOLDERNAME && bm.type === "folder") {
						bookmarkFolder = bm;

						resolve(bm);
						return;
					}
				}
			}
			
			reject("Tabs Aside root bookmark folder not found");
		}, reject);
	});
}

function getSessions() {
	return new Promise((resolve, reject) => {
		// local
		let sessions = [];

		for (bm of bookmarkFolder.children) {
			if (bm.type === "folder" && bm.title.indexOf(BMPREFIX) === 0) {
				sessions.push(new TabSession(bm));
			}
		}

		resolve(sessions);
	});
}

function refresh() {
	loadBMRoot().then(getSessions).then(data => {
		data.reverse();
		sessions = data;

		list.innerHTML = "";

		sessions.forEach((session, index) => {
			list.appendChild(session.html);

			// auto expand last session
			if (index === 0) {
				session.expand();
			}
		});
	}).catch(onRejected);
}

window.addEventListener("load", () => {
	refresh();
});

browser.runtime.onMessage.addListener(message => {
	if (message.command === "refresh") {
		refresh();
	}
});