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