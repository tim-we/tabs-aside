import Options from "./options";

document.addEventListener("DOMContentLoaded", _ => {
	let section = document.getElementById("main-section");
	// option index, this is needed to create unique ids
	let i = 0;

	// iterate over options
	for(let optionKey in Options) {
		let option = Options[optionKey];
		let i18nMessageName = "option_" + optionKey;

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
			label.innerText = browser.i18n.getMessage(i18nMessageName);

			row.appendChild(checkbox);
			row.appendChild(label);
		} else if(option.type === "select") {
			let select:HTMLSelectElement = document.createElement("select");
			select.id = "select" + i;

			option.options.forEach(o => {
				let selectOption:HTMLOptionElement = document.createElement("option");
				selectOption.value = o;
				selectOption.innerText = browser.i18n.getMessage(i18nMessageName + "__" + o) || "@ERROR";

				select.appendChild(selectOption);
			});

			let label:HTMLLabelElement = document.createElement("label");
			label.setAttribute("for", select.id);
			label.innerText = browser.i18n.getMessage(i18nMessageName) || "empty";

			row.appendChild(label);
			row.appendChild(select);
		} else if(option.type === "bookmark") {
			let folderView:HTMLDivElement = document.createElement("div");
			folderView.title = browser.i18n.getMessage("bookmarkFolderSelector_tooltip");
			folderView.id = "bmBox" + i;
			folderView.classList.add("bookmarkFolderView");
			folderView.innerText = "Folder";

			let label:HTMLLabelElement = document.createElement("label");
			label.setAttribute("for", folderView.id);
			label.innerText = browser.i18n.getMessage(i18nMessageName);

			row.appendChild(label);
			row.appendChild(folderView);
		} else {
			// option type not recognized -> skip
			continue;
		}

		if(option.hint) {
			row.title = browser.i18n.getMessage(i18nMessageName + "_hint");
		}

		if(option.info) {
			row.appendChild(document.createElement("br"));
			
			let info:HTMLParagraphElement = document.createElement("p");
			info.innerHTML = browser.i18n.getMessage(i18nMessageName + "_info");
			info.classList.add("info");
			row.appendChild(info);
		}

		// append row
		section.appendChild(row);
		i++;
	}
});