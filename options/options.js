let restoreBehavior = document.getElementById("restore-behavior");

browser.storage.local.get("restoreBehavior").then(data => {
	if (data.restoreBehavior) {
		let v = data.restoreBehavior;
		let r = restoreBehavior;

		for (let i = 0, opt; opt = r.options[i]; i++) {
			if (opt.value === v) {
				r.selectedIndex = i;
				break;
			}
		}
	} else {
		browser.storage.local.set({
			restoreBehavior: "auto-remove"
		});
	}
});

restoreBehavior.addEventListener("change", e => {
	let r = restoreBehavior;

	browser.storage.local.set({
		restoreBehavior: r.options[r.selectedIndex].value
	});
});

function setUpCheckbox(domID, defaultValue, sKey=domID) {
	let checkbox = document.getElementById(domID);

	// set initial value
	browser.storage.local.get(sKey).then(data => {
		if(data[sKey] !== undefined) {
			let v = data[sKey]; // boolean

			checkbox.checked = v;
		} else {
			checkbox.checked = defaultValue;
		}
	});

	// state change handler
	checkbox.addEventListener("change", () => {

		let options = {};
		options[sKey] = checkbox.checked;

		browser.storage.local.set(options);
	});
}

setUpCheckbox("ignore-pinned", true);
setUpCheckbox("expand-menu", false);

let bmRootFolder = document.getElementById("bm-root-folder");
let selectorwindowID = null;
let bmFolder = null;

browser.storage.local.get("bookmarkFolderID").then(data => {
	if (data.bookmarkFolderID) {
		let bmID = data.bookmarkFolderID;
		
		browser.bookmarks.get(bmID).then(data => {
			bmFolder = data[0];
			bmRootFolder.innerText = bmFolder.title;
		});
	}
});

bmRootFolder.addEventListener("click", () => {

	if (selectorwindowID) {
		// close selector window
		browser.windows.remove(selectorwindowID);
	}

	let url = "../bm-selector/popup.html";

	if (bmFolder) {
		url += "?selected=" + bmFolder.id;
	}

	browser.windows.create({
		allowScriptsToClose: true, // does not work!
		//focused: true, // not supported by FF
		width: 500,
		height: 300,
		titlePreface: "Tabs Aside! ",
		type: "popup",
		url: url
	}).then(w => {
		selectorwindowID = w.id;
	});
});

// message listener
browser.runtime.onMessage.addListener(message => {
	if (message.command === "updateRoot" && message.bmID) {
		let bmID = message.bmID;

		// close selector window
		if (selectorwindowID) {
			browser.windows.remove(selectorwindowID);
		}

		console.log("selected folder id: " + bmID);

		browser.bookmarks.get(bmID).then(data => {
			bmFolder = data[0];

			bmRootFolder.innerText = bmFolder.title;
		});

		browser.storage.local.set({
			bookmarkFolderID: bmID
		});
	}
});