import Options from "./Options";
import * as OptionsManager from "./OptionsManager";

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
			let value:Promise<boolean> = OptionsManager.getValue<boolean>(optionKey);

			let checkbox:HTMLInputElement = document.createElement("input");
			checkbox.id = "checkbox" + i;
			checkbox.type = "checkbox";
			checkbox.classList.add("browser-style");

			value.then(v => checkbox.checked = v);

			let label = document.createElement("label");
			label.setAttribute("for", checkbox.id);
			label.innerText = browser.i18n.getMessage(i18nMessageName);

			checkbox.addEventListener("change", () => {
				OptionsManager.setValue(optionKey, checkbox.checked);
			});

			row.appendChild(checkbox);
			row.appendChild(label);
		} else if(option.type === "select") {
			let value:Promise<string> = OptionsManager.getValue<string>(optionKey);

			let select:HTMLSelectElement = document.createElement("select");
			select.id = "select" + i;
			
			let selectOptions = option.options;

			value.then(v => {
				selectOptions.forEach(o => {
					let selectOption:HTMLOptionElement = document.createElement("option");
					selectOption.value = o;
					selectOption.innerText = browser.i18n.getMessage(i18nMessageName + "__" + o) || "@ERROR";
					
					if(v === o) {
						selectOption.selected = true;
					}

					select.appendChild(selectOption);
				});
			});

			let label:HTMLLabelElement = document.createElement("label");
			label.setAttribute("for", select.id);
			label.innerText = browser.i18n.getMessage(i18nMessageName) || "empty";

			select.addEventListener("change", () => {
				let x = select.options[select.selectedIndex].value;
				OptionsManager.setValue(optionKey, x);
			});

			row.appendChild(label);
			row.appendChild(select);
		} else if(option.type === "bookmark") {
			let value:Promise<string> = OptionsManager.getValue<string>(optionKey);

			let folderView:HTMLDivElement = document.createElement("div");
			folderView.title = browser.i18n.getMessage("bookmarkFolderSelector_tooltip");
			folderView.id = "bmBox" + i;
			folderView.setAttribute("data-bmId", "");
			folderView.classList.add("bookmarkFolderView");
			folderView.innerText = "...";
			
			value.then(bookmarkId => {
				if(bookmarkId) {
					folderView.setAttribute("data-bmId", bookmarkId);
					return browser.bookmarks.get(bookmarkId);
				} else {
					return Promise.reject();
				}
			}).then(
				bookmark => folderView.innerText = bookmark[0].title
			);

			folderView.addEventListener("click", () => {
				let url = "../html/bookmark-selector.html?fpreset=" + encodeURIComponent("Tabs Aside");
				
				let bmId:string = folderView.getAttribute("data-bmId") || "";

				if(bmId) {
					url += "&selected=" + bmId;
				}

				browser.windows.create({
					//focused: true, // not supported by FF
					width: 500,
					height: 300,
					//@ts-ignore
					titlePreface: "Tabs Aside! ",
					type: "popup",
					url: url
				});
			});

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