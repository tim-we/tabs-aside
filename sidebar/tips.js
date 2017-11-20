var tipElem = null;
var tipMsg = null;
var closeBtn = null;

var currenttipID = -1;

window.addEventListener("load", () => {
	// get DOM references
	tipElem = document.getElementById("tip");
	tipMsg = document.getElementById("tip-msg");
	closeBtn = document.getElementById("tip-close");

	// set up close button click event
	closeBtn.addEventListener("click", () => {
		tipElem.classList.remove("show");

		// store updated state
		browser.storage.local.set({
			tipData: {
				id: currenttipID
			}
		});
	});

	// load state
	browser.storage.local.get().then(data => {
		var tipID = -1;

		if (data.tipData && data.tipData.id !== undefined) {
			tipID = Math.max(0, data.tipData.id);
		}

		// show tips
		if (tipID === -1) {
			showTip("To keep the session after restoring press CTRL while clicking on <Restore tabs>", 0);
		} else if (tipID === 0) {
			let dir = "Other Bookmarks > Tabs Aside";
			showTip(`To make further changes to your session switch to the bookmark sidebar. The sessions can be found in '${dir}'.`, 1);
		}
	});
});

function showTip(tipText, id) {
	tipMsg.innerText = tipText;
	tipElem.classList.add("show");
	currenttipID = id;
}