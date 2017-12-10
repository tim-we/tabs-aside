var tabs = [];
var selectionMask;
var container = null;

window.addEventListener("load", () => {
	container = document.getElementById("tabs");
	var actions = document.getElementById("actions");

	getTabs().then(ts => {
		// filter tabs that could not be reopened by an extension
		tabs = ts.filter(tabFilter);

		// init selection mask (default value false)
		selectionMask = new Array(tabs.length);

		// set layout
		container.classList.add(getLayout(tabs.length));
		
		// generate tab list
		tabs.forEach((tab, index) => {
			container.appendChild(generateTabHTML(tab, index));
		});

		actions.classList.remove("hidden");
	});

	// set up buttons
	document.getElementById("aside-btn").addEventListener("click", () => {
		browser.sidebarAction.open();
		actionHandler("aside");
	});

	document.getElementById("save-btn").addEventListener("click", () => {
		browser.sidebarAction.open();
		actionHandler("save");
	});

	// check if this panel was launched from the 'more tools' panel
	if (document.body.clientWidth > window.innerWidth) {
		document.body.classList.add("limited");
	}
});

function selectionNotEmpty() {
	return selectionMask.includes(true);
}

function actionHandler(cmd) {
	if (selectionNotEmpty()) {
		// hide tabs
		container.remove();

		let selection = tabs.filter((_, i) => selectionMask[i]);

		// if all tabs are being closed -> open a new one
		let newtab = selection.length === tabs.length;

		let now = new Date();
		
		// tabs aside!
		return browser.runtime.sendMessage({
			command: cmd,
			newtab: newtab,
			tabs: selection,
			title: `Selection ${now.getMonth()+1}/${now.getDate()}`
		}).then(() => {
			history.back();
		});
	}
}

function generateTabHTML(tab, index) {
	let html = document.createElement("div");
	html.classList.add("tab");
	html.title = tab.title;

	if (tab.favIconUrl) {
		let img = new Image();

		// if image can not be loaded (is broken, is missing)
		img.onerror = () => {
			img.remove();
			html.classList.add("no-favicon");
		};

		img.src = tab.favIconUrl;
		img.classList.add("favicon");
		img.alt = "icon";

		html.appendChild(img);
	} else {
		html.classList.add("no-favicon");
	}

	let title = document.createElement("div");
	title.classList.add("tab-title");
	title.innerText = tab.title;

	html.appendChild(title);

	html.addEventListener("click", () => {
		if (selectionMask[index]) {
			html.classList.remove("selected");
		} else {
			html.classList.add("selected");
		}

		selectionMask[index] = !selectionMask[index];
	});

	return html;
}

function getLayout(n) {
	if (n < 4) {
		return "cols1";
	} else if (n == 4) {
		return "cols2";
	} else if (n <= 9) {
		return "cols3";
	} else if (n <= 16) {
		return "cols4";
	} else if (n <= 42) {
		return "cols5";
	} else {
		return "cols6";
	}
}