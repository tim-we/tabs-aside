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

function openSidebar() {
	if (browser.sidebarAction && browser.sidebarAction.open) {
		browser.sidebarAction.open();
	}
}

// attach click listeners
aside.addEventListener("click", () => {
	if (allowClick()) {
		browser.runtime.sendMessage({ command: "aside" });
		
		openSidebar();
	}
});

if (browser.sidebarAction && browser.sidebarAction.open) {
	session.addEventListener("click", openSidebar);
} else {
	session.classList.add("disabled");
	session.title = "This feature requires Firefox 57 or higher";
}