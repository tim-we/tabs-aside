var tabs = [];
var selectionMask;

window.addEventListener("load", () => {
	var container = document.getElementById("tabs");

	getTabs().then(ts => {
		tabs = ts;

		// init selection mask (default value false)
		selectionMask = new Array(tabs.length);

		// set layout
		container.classList.add(getLayout(tabs.length));
		
		// generate tab list
		tabs.forEach((tab, index) => {
			container.appendChild(generateTabHTML(tab, index));
		});
	});
});

function generateTabHTML(tab, index) {
	let html = document.createElement("div");
	html.classList.add("tab");

	if (tab.favIconUrl) {
		let img = new Image();
		img.src = tab.favIconUrl;
		img.classList.add("favicon");
		img.alt = "favicon";
		html.appendChild(img);
	} else {
		html.classList.add("no-favicon");
	}

	let title = document.createElement("div");
	title.classList.add("tab-title");
	title.innerText = tab.title;

	html.appendChild(title);

	html.addEventListener("click", () => {
		if (selectionMask[index]) {
			html.classList.remove("selected");
		} else {
			html.classList.add("selected");
		}

		selectionMask[index] = !selectionMask[index];
	});

	return html;
}

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