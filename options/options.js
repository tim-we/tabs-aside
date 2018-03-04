function initSelectInput(optionID, defaultValue, setStorage) {
	let domRef = document.getElementById(optionID);

	browser.storage.local.get(optionID).then(data => {
		if (data[optionID]) {
			let v = data[optionID];
	
			for (let i = 0, opt; opt = domRef.options[i]; i++) {
				if (opt.value === v) {
					domRef.selectedIndex = i;
					break;
				}
			}
		} else if(setStorage) {
			let o = {};
			o[optionID] = defaultValue;

			browser.storage.local.set(o);
		}
	});

	domRef.addEventListener("change", e => {
		let o = {};
		o[optionID] = domRef.options[domRef.selectedIndex].value;

		browser.storage.local.set(o);
	});
}

function initCheckboxInput(domID, defaultValue, sKey=domID) {
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

function initRadioInput(name, defaultValue, storageKey, changeHandler) {
	let radios = document.querySelectorAll(`input[type=radio][name='${name}']`);
	
	console.assert(radios.length > 0, "[TA] input radio not found!");

	function setValue(value) {
		radios.forEach(r => {
			if(r.value === value) { r.checked = true; }
		});
	}

	browser.storage.local.get(storageKey).then(data => {
		if(data[storageKey] !== undefined) {
			setValue(data[storageKey]);
		} else {
			setValue(defaultValue);
		}
	});

	radios.forEach(r => {
		let radio = r;
		r.addEventListener("change", () => {
			if(radio.checked) {
				changeHandler(radio.value);

				let options = {};
				options[storageKey] = radio.value;

				browser.storage.local.set(options);
			}
		});
	});
}

initCheckboxInput("ignore-pinned", true);
initCheckboxInput("expand-menu", false);
initCheckboxInput("show-badge", true);
initSelectInput("sbSessionDefaultState", "expand-top", false);
initRadioInput("ba-icon", "dark", "ba-icon", value => {
	let map = new Map();
	map.set("dark",    "tabs-aside-16-dark.svg");
	map.set("light",   "tabs-aside-16-light.svg");
	map.set("dynamic", "tabs-aside-16.svg");

	if(map.has(value)) {
		let iconPath = "icons/" + map.get(value);

		browser.browserAction.setIcon({
			path: {
				"16": iconPath,
				"32": iconPath
			}
		}).catch(e => console.error(""+e));
	} else {
		console.error("[TA] ba-icon error");
	}
	
});

document.getElementById("show-badge").addEventListener("change", () => {
	browser.runtime.sendMessage({
		command: "options-changed"
	});
});

let bmRootFolder = document.getElementById("bm-root-folder");
let selectorwindowID = null;
let bmFolder = null;

browser.storage.local.get("bookmarkFolderID").then(data => {
	if (data.bookmarkFolderID) {
		let bmID = data.bookmarkFolderID;
		
		browser.bookmarks.get(bmID).then(data => {
			bmFolder = data[0];
			bmRootFolder.textContent = bmFolder.title;
		});
	}
});

bmRootFolder.addEventListener("click", () => {

	if (selectorwindowID) {
		// close selector window
		browser.windows.remove(selectorwindowID);
	}

	let url = "../bm-selector/popup.html?fpreset=" + encodeURIComponent("Tabs Aside");

	if (bmFolder) {
		url += "&selected=" + bmFolder.id;
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

			bmRootFolder.textContent = bmFolder.title;
		});
	}
});