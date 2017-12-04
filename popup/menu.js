let btnLock = false;

// get button elements
let aside   = document.getElementById("aside-btn");
let session = document.getElementById("session-btn");
let save = document.getElementById("save-btn");
let select = document.getElementById("select-btn");
let more = document.getElementById("more-btn");

function lockButton() {
	btnLock = true;
	aside.classList.add("disabled");
	save.classList.add("disabled");
}

function unlockButton() {
	btnLock = false;
	aside.classList.remove("disabled");
	save.classList.remove("disabled");
}

// attach click listeners
aside.addEventListener("click", () => {
	if (!btnLock) {
		lockButton();
		browser.runtime.sendMessage({ command: "aside" });
		
		browser.sidebarAction.open();
	}
});

session.addEventListener("click", () => { browser.sidebarAction.open(); });

save.addEventListener("click", () => {
	if(!btnLock) {
		lockButton();
		browser.runtime.sendMessage({ command: "asideAll", save:true });

		browser.sidebarAction.open();
	}
});

if (location.hash.replace("#", "").trim() === "expand") {
	showMore();
} else {
	more.addEventListener("click", showMore);
}

browser.runtime.onMessage.addListener(message => {
	if (message.command === "refresh") {
		// setting tabs aside done
		unlockButton();
	}
});

function showMore() {
	save.classList.remove("hidden");
	select.classList.remove("hidden");

	more.remove();
}