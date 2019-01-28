import * as OptionsManager from "./OptionsManager.js";
import { Option } from "./OptionTypeDefinition.js";
import Options from "./Options.js";

import * as BooleanControl from "./Controls/BooleanControl.js";
import * as BookmarkControl from "./Controls/BookmarkControl.js";
import * as SelectControl from "./Controls/SelectControl.js";
import * as HTMLUtilities from "../util/HTMLUtilities.js";

document.addEventListener("DOMContentLoaded", async () => {
	HTMLUtilities.i18n();

	// Multiple options depend on the active session option
	if(await OptionsManager.getValue<boolean>("activeSessions")) {
		document.body.classList.add("active-sessions");
	}
	// react to changes
	OptionsManager.addChangeListener("activeSessions", (newValue:boolean) => {
		if(newValue) {
			document.body.classList.add("active-sessions");
		} else {
			document.body.classList.remove("active-sessions");
		}
	});

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
		row.classList.add("row", "browser-style", option.type);

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

		if(option.activeOnly) {
			row.classList.add("active-only");
		}

		// append row
		section.appendChild(row);
		i++;
	});
});