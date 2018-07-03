import Options from "./Options";
import * as OptionsManager from "./OptionsManager";
import { Option, SelectOption } from "./OptionTypeDefinition";

document.addEventListener("DOMContentLoaded", async () => {
	let section = document.getElementById("main-section");
	// option index, this is needed to create unique ids
	let i = 0;

	// iterate over options
	for(let optionKey in Options) {
		let option:Option = Options[optionKey];
		let i18nMessageName = "option_" + optionKey;

		// skip hidden options
		if(option.hidden) { continue; }

		// create row
		let row:HTMLDivElement = document.createElement("div");
		row.classList.add("row");
		row.classList.add(option.type);

		if(option.type === "boolean") {
			let value:boolean = await OptionsManager.getValue<boolean>(optionKey);

			booleanOptionView(
				row,
				optionKey, option, value,
				i18nMessageName,
				i
			);
		} else if(option.type === "select") {
			let value:string = await OptionsManager.getValue<string>(optionKey);

			selectOptionView(
				row,
				optionKey, option, value,
				i18nMessageName,
				i
			);
		} else if(option.type === "bookmark") {
			let value:string = await OptionsManager.getValue<string>(optionKey);

			bookmarkOptionView(
				row,
				optionKey, option, value,
				i18nMessageName,
				i
			);
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

function booleanOptionView(
	row:HTMLDivElement,
	optionKey:string, option:Option, value:boolean,
	i18nMessageName:string,
	i:number
):void {
	let checkbox:HTMLInputElement = document.createElement("input");
	checkbox.id = "checkbox" + i;
	checkbox.type = "checkbox";
	checkbox.classList.add("browser-style");
	checkbox.checked = value;

	let label = document.createElement("label");
	label.setAttribute("for", checkbox.id);
	label.innerText = browser.i18n.getMessage(i18nMessageName);

	checkbox.addEventListener("change", () => {
		OptionsManager.setValue(optionKey, checkbox.checked);
	});

	row.appendChild(checkbox);
	row.appendChild(label);
}

function selectOptionView(
	row:HTMLDivElement,
	optionKey:string, option:SelectOption, value:string,
	i18nMessageName:string,
	i:number
):void {
	let select:HTMLSelectElement = document.createElement("select");
	select.id = "select" + i;
	
	let selectOptions = option.options;

	selectOptions.forEach(o => {
		let selectOption:HTMLOptionElement = document.createElement("option");
		selectOption.value = o;
		selectOption.innerText = browser.i18n.getMessage(i18nMessageName + "__" + o) || "@ERROR";
		
		if(value === o) {
			selectOption.selected = true;
		}

		select.appendChild(selectOption);
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
}

function bookmarkOptionView(
	row:HTMLDivElement,
	optionKey:string, option:Option, bookmarkId:string,
	i18nMessageName:string,
	i:number
) {
	let folderView:HTMLDivElement = document.createElement("div");
	folderView.title = browser.i18n.getMessage("bookmarkFolderSelector_tooltip");
	folderView.id = "bmBox" + i;
	folderView.setAttribute("data-bmId", "");
	folderView.classList.add("bookmarkFolderView");
	folderView.innerText = "...";
	
	let promise:Promise<browser.bookmarks.BookmarkTreeNode[]> = (bookmarkId) ?
		browser.bookmarks.get(bookmarkId) :
		Promise.reject();

	if(bookmarkId) {
		folderView.setAttribute("data-bmId", bookmarkId);
	}
	
	promise.then(
		bookmarks => folderView.innerText = bookmarks[0].title
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
}