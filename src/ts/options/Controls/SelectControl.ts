import { SelectOption } from "../OptionTypeDefinition.js";
import * as OptionsManager from "../OptionsManager.js";

export function create(
    row:HTMLDivElement,
    i:number,
    option:SelectOption, value:string,
    i18nMessageName:string
):void {
    let select:HTMLSelectElement = document.createElement("select");
	select.id = "select" + i;
	select.classList.add("browser-style");
	
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
		OptionsManager.setValue(option.id, x);
	});

	row.appendChild(label);
	row.appendChild(select);
}