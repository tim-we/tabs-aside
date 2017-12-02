window.addEventListener("load", () => {
	var test = document.getElementById("tabs");

	browser.tabs.query({
		currentWindow: true,
		pinned: false
	}).then(tabs => {
		test.classList.add(getLayout(tabs.length));

		var html = "";
		
		tabs.forEach(tab => {
			let classes = ["tab"];

			if (!tab.favIconUrl) {
				classes.push("no-favicon");
			}

			if (Math.random() < 0.42) {
				classes.push("selected");
			}

			html += `<div class="${classes.join(" ")}">`;
			if (tab.favIconUrl) {
				html += `<img class="favicon" src="${tab.favIconUrl}" alt="favicon">`;
			}
			html += `<div class="tab-title">${tab.title}</div></div>`;
		});
	
		test.innerHTML = html;
	});
});

function getLayout(n) {
	if (n < 4) {
		return "cols1";
	} else if(n == 4) {
		return "cols2";
	} else if (n <= 9) {
		return "cols3";
	} else if (n <= 16) {
		return "cols4";
	} else {
		return "cols5";
	}
}