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

function openSidebar(auto = false) {
	if (browser.sidebarAction && browser.sidebarAction.open) {
		browser.sidebarAction.open();
	} else if(!auto) {
		window.open("../sidebar/sidebar.html?popup", null, "height=600,width=400,status=no,toolbar=no,menubar=no,location=no");
	}
}

// attach click listeners
aside.addEventListener("click", () => {
	if (allowClick()) {
		browser.runtime.sendMessage({ command: "aside" });
		
		openSidebar(true);
	}
});

session.addEventListener("click", openSidebar);