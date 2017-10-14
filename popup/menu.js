const COOLDOWN = 500; // ms
let lastTS = 0;

// get button elements
let aside = document.getElementById("aside-btn");
let session = document.getElementById("session-btn");

function allowClick() {
	if (Date.now() - lastTS > COOLDOWN) {
		lastTS = Date.now();
		return true;
	}

	return false;
}

// attach click listeners
aside.addEventListener("click", () => {
	if (allowClick()) {
		browser.runtime.sendMessage({ command: "aside" });
		
		browser.sidebarAction.open();
	}
});

session.addEventListener("click", () => {
	browser.sidebarAction.open();
});