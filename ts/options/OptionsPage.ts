import Options from "./Options";
import * as OptionsManager from "./OptionsManager";
import { Option, SelectOption } from "./OptionTypeDefinition";
import * as BooleanControl from "./Controls/BooleanControl";
import * as BookmarkControl from "./Controls/BookmarkControl";

document.addEventListener("DOMContentLoaded", () => {
	let section = document.getElementById("main-section");
	// option index, this is needed to create unique ids
	let i = 0;

	// iterate over options
	Options.forEach(async option => {
		let i18nMessageName = "option_" + option.id;

		// skip hidden options
		if(option.hidden) { return; }

		// create row
		let row:HTMLDivElement = document.createElement("div");
		row.classList.add("row");
		row.classList.add(option.type);

		if(option.type === "boolean") {
			let value:boolean = await OptionsManager.getValue<boolean>(option.id);

			BooleanControl.create(
				row, i,
				option, value,
				i18nMessageName
			);
		} else if(option.type === "select") {
			let value:string = await OptionsManager.getValue<string>(option.id);

			selectOptionView(
				row,
				option.id, option, value,
				i18nMessageName,
				i
			);
		} else if(option.type === "bookmark") {
			let value:string = await OptionsManager.getValue<string>(option.id);

			BookmarkControl.create(
				row, i,
				option, value,
				i18nMessageName
			);
		} else {
			// option type not recognized -> skip
			return;
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
	});
});

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