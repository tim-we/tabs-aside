let restoreBehavior = document.getElementById("restore-behavior");

browser.storage.local.get("restoreBehavior").then(data => {
	if (data.restoreBehavior) {
		let v = data.restoreBehavior;
		let r = restoreBehavior;

		for (let i = 0, opt; opt = r.options[i]; i++) {
			if (opt.value === v) {
				r.selectedIndex = i;
				break;
			}
		}
	} else {
		browser.storage.local.set({
			restoreBehavior: "auto-remove"
		});
	}
});

restoreBehavior.addEventListener("change", e => {
	let r = restoreBehavior;

	browser.storage.local.set({
		restoreBehavior: r.options[r.selectedIndex].value
	});
});

function setUpCheckbox(domID, defaultValue, sKey=domID) {
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

setUpCheckbox("ignore-pinned", true);
setUpCheckbox("expand-menu", false);