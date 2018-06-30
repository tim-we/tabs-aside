import Options from "./options";

document.addEventListener("DOMContentLoaded", _ => {
	let section = document.getElementById("main-section");
	// option index
	let i = 0;

	// iterate over options
	for(let optionKey in Options) {
		let option = Options[optionKey];

		// create row
		let row:HTMLDivElement = document.createElement("div");
		row.classList.add("row");
		row.classList.add(option.type);

		if(option.type === "boolean") {
			let checkbox:HTMLInputElement = document.createElement("input");
			checkbox.id = "checkbox" + i;
			checkbox.type = "checkbox";
			checkbox.classList.add("browser-style");

			let label = document.createElement("label");
			label.setAttribute("for", checkbox.id);
			label.innerText = browser.i18n.getMessage("option_" + optionKey);

			row.appendChild(checkbox);
			row.appendChild(label);
		} else if(option.type === "bookmark") {
			let folderView:HTMLDivElement = document.createElement("div");
			folderView.title = browser.i18n.getMessage("bookmarkFolderSelector_tooltip");
			folderView.id = "bmBox" + i;
			folderView.classList.add("bookmarkFolderView");
			folderView.innerText = "Folder";

			let label:HTMLLabelElement = document.createElement("label");
			label.setAttribute("for", folderView.id);
			label.innerText = browser.i18n.getMessage("option_" + optionKey);

			row.appendChild(label);
			row.appendChild(folderView);
		} else {
			// option type not recognized -> skip
			continue;
		}

		// append row
		section.appendChild(row);
		i++;
	}
});