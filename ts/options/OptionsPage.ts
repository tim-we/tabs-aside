import * as OptionsManager from "./OptionsManager";
import { Option } from "./OptionTypeDefinition";
import Options from "./Options";

import * as BooleanControl from "./Controls/BooleanControl";
import * as BookmarkControl from "./Controls/BookmarkControl";
import * as SelectControl from "./Controls/SelectControl";

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

			SelectControl.create(
				row, i,
				option, value,
				i18nMessageName
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