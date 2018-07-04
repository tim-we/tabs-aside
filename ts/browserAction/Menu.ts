import MenuItems from "./MenuItems";
import { MenuItem } from "./MenuItemType";
import * as OptionsManager from "../options/OptionsManager";

let showAll:boolean = false;

let sessionsContainer:HTMLDivElement;
let buttonsContainer:HTMLDivElement;

document.addEventListener("DOMContentLoaded", async () => {
	// get DOM references
	sessionsContainer = document.getElementById("sessions") as HTMLDivElement;
	buttonsContainer  = document.getElementById("buttons") as HTMLDivElement;

	showAll = await OptionsManager.getValue<boolean>("menuShowAll");

	// create buttons
	MenuItems.forEach(
		item => buttonsContainer.appendChild(createButton(item))
	);
});

function createButton(item:MenuItem):HTMLAnchorElement {
	let button:HTMLAnchorElement = document.createElement("a");

	button.classList.add("button");

	button.innerText = browser.i18n.getMessage("menu_" + item.id + "_label") || item.id;

	return button;
}