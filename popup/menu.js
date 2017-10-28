let btnLock = false;

// get button elements
let aside = document.getElementById("aside-btn");
let session = document.getElementById("session-btn");

function lockButton() {
	btnLock = true;
	aside.disabled = true;
	aside.classList.add("disabled");
}

function unlockButton() {
	btnLock = false;
	aside.classList.remove("disabled");
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
	if (!btnLock) {
		lockButton();
		browser.runtime.sendMessage({ command: "aside" });
		
		openSidebar(true);
	}
});

session.addEventListener("click", openSidebar);

browser.runtime.onMessage.addListener(message => {
	if (message.command === "refresh") {
		// setting tabs aside done
		unlockButton();
	}
});