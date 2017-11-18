var tipElem = null;
var tipMsg = null;
var closeBtn = null;

var tipID = -1;

window.addEventListener("load", () => {
	tipElem = document.getElementById("tip");
	tipMsg = document.getElementById("tip-msg");
	closeBtn = document.getElementById("tip-close");

	closeBtn.addEventListener("click", () => {
		tipElem.classList.remove("show");

		browser.storage.local.set({
			tipData: {
				id: tipID
			}
		});
	});
});

function showTip(tipText, id) {
	tipMsg.innerText = tipText;
	tipElem.classList.add("show");
	tipID = id;
}