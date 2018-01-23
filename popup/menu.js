let btnLock = false;

// get button elements
let asideBtn	= document.getElementById("aside-btn");
let sessionBtn	= document.getElementById("session-btn");
let saveBtn		= document.getElementById("save-btn");
let selectBtn	= document.getElementById("select-btn");
let moreBtn		= document.getElementById("more-btn");

function lockButtons() {
	btnLock = true;
	asideBtn.classList.add("disabled");
	saveBtn.classList.add("disabled");
}

function unlockButtons() {
	btnLock = false;
	asideBtn.classList.remove("disabled");
	saveBtn.classList.remove("disabled");
}

function actionHandler(closeTabs) {
	return getTabs().then(tabs => {
		// tabs aside!
		return browser.runtime.sendMessage({
			command: closeTabs ? "aside" : "save",
			newtab: closeTabs && !hasAboutNewTab(tabs),
			tabs: tabs.filter(tabFilter)
		}).catch(error => console.log("Error: " + error));
	});
}

// attach click listeners
asideBtn.addEventListener("click", () => {
	if (!btnLock) {
		lockButtons();
		actionHandler(true);
		
		browser.sidebarAction.open();
	}
});

sessionBtn.addEventListener("click", () => { browser.sidebarAction.open(); });

saveBtn.addEventListener("click", () => {
	if(!btnLock) {
		lockButtons();
		actionHandler(false);

		browser.sidebarAction.open();
	}
});

if (location.hash.replace("#", "").trim() === "expand") {
	showMore();
} else {
	browser.storage.local.get("expand-menu").then(data => {
		let expand = (data["expand-menu"] !== undefined) ? data["expand-menu"] : false;

		if(expand) {
			showMore();
		} else {
			moreBtn.addEventListener("click", showMore);
		}
	});
}

browser.runtime.onMessage.addListener(message => {
	if (message.command === "refresh") {
		// setting tabs aside done
		unlockButtons();
	}
});

function showMore() {
	saveBtn.classList.remove("hidden");
	selectBtn.classList.remove("hidden");

	location.hash = "expand";

	moreBtn.remove();
}