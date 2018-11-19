import { Option } from "../OptionTypeDefinition";
import * as OptionsManager from "../OptionsManager";

export function create(
	row:HTMLDivElement,
	i:number,
	option:Option, value:boolean,
	i18nMessageName:string
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
		OptionsManager.setValue(option.id, checkbox.checked);
	});

	row.appendChild(checkbox);
	row.appendChild(label);
}