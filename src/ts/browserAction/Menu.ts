import MenuItems from "./MenuItems.js";
import { MenuItem } from "./MenuItemType.js";
import * as OptionsManager from "../options/OptionsManager.js";

let showAll:boolean = false;

let sessionsContainer:HTMLDivElement;
let buttonsContainer:HTMLDivElement;

let stateInfo = {
	//TODO
	freeTabs: true
};

document.addEventListener("DOMContentLoaded", async () => {
	// get DOM references
	sessionsContainer = document.getElementById("sessions") as HTMLDivElement;
	buttonsContainer  = document.getElementById("buttons") as HTMLDivElement;

	showAll = await OptionsManager.getValue<boolean>("menuShowAll");

	// create buttons
	MenuItems.forEach(
		item => buttonsContainer.appendChild(createButton(item))
	);

	if(showAll) {
		buttonsContainer.classList.add("showAll");
	} else {
		let more = createButton({
			id: "more",
			icon: "more-16.svg",
			closeMenu: false,
			tooltip: true,
			onclick: () => {
				buttonsContainer.classList.add("showAll");
				more.remove();
			}
		});

		buttonsContainer.appendChild(more);
	}
});

function createButton(item:MenuItem):HTMLAnchorElement {
	let button:HTMLAnchorElement = document.createElement("a");

	button.classList.add("button");
	if(item.optional) {
		button.classList.add("optional");
	}

	button.innerText = browser.i18n.getMessage("menu_" + item.id + "_label") || item.id;

	if(item.icon) {
		let iconURL:string = "../../img/menu/" + item.icon;
		button.style.setProperty("--iconURL", `url('${iconURL}')`);
		button.classList.add("icon");

		if(item.wideIcon) {
			button.classList.add("wide");
		}
	}

	if(item.shortcut) {
		button.dataset.shortcut = item.shortcut;
	}

	if(item.tooltip) {
		button.title = browser.i18n.getMessage("menu_" + item.id + "_tooltip");
	}

	let enabled:boolean = item.applicable ? item.applicable(stateInfo) : true;

	if(!enabled) {
		button.classList.add("disabled");
		button.title = browser.i18n.getMessage("menu_action_not_applicable");
	}

	if(enabled && item.href) {
		button.href = item.href;
	}

	if(enabled && item.onclick) {
		button.addEventListener("click", e => {
			item.onclick(e);

			if(item.closeMenu !== false) {
				window.close();
			}
		});
	}

	return button;
}