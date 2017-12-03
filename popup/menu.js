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

function openSidebar() {
	if (browser.sidebarAction && browser.sidebarAction.open) {
		browser.sidebarAction.open();
	}
}

// attach click listeners
aside.addEventListener("click", () => {
	if (!btnLock) {
		lockButton();
		browser.runtime.sendMessage({ command: "aside" });
		
		openSidebar(true);
	}
});

session.addEventListener("click", openSidebar);

save.addEventListener("click", () => {
	if(!btnLock) {
		lockButton();
		browser.runtime.sendMessage({ command: "aside", save:true });

		openSidebar(true);
	}
});

more.addEventListener("click", () => {
	save.classList.remove("hidden");
	select.classList.remove("hidden");

	more.remove();
});

browser.runtime.onMessage.addListener(message => {
	if (message.command === "refresh") {
		// setting tabs aside done
		unlockButton();
	}
});