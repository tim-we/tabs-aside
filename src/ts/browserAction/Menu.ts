import MenuItems from "./MenuItems.js";
import { MenuItem } from "./MenuItemType.js";
import * as OptionsManager from "../options/OptionsManager.js";
import { StateInfoData, DataRequest } from "../messages/Messages.js";

let activeSessionIndicator:HTMLDivElement;
let buttonsContainer:HTMLDivElement;

let stateInfo:StateInfoData;

document.addEventListener("DOMContentLoaded", async () => {

	// get DOM references
	activeSessionIndicator = document.getElementById("active-session-indicator") as HTMLDivElement;
	buttonsContainer   = document.getElementById("buttons") as HTMLDivElement;

	stateInfo = await DataRequest.send("state-info");

	if(stateInfo.currentSession) {
		// current tab is part of an active session
		document.body.classList.add("active-session");
		activeSessionIndicator.innerText = browser.i18n.getMessage(
			"menu_active-session-indicator", 
			[stateInfo.currentSession.title]
		);
		activeSessionIndicator.title = browser.i18n.getMessage("menu_active-session-indicator_tooltip");
	}

	// create buttons
	MenuItems.forEach(
		item => buttonsContainer.appendChild(createButton(item))
	);
});

function createButton(item:MenuItem):HTMLAnchorElement {
	let button:HTMLAnchorElement = document.createElement("a");

	if(item.hide && item.hide(stateInfo)) {
		button.style.display = "none";
		return button;
	}

	button.classList.add("button");
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

	let enabled:boolean = item.isApplicable ? item.isApplicable(stateInfo) : true;

	if(!enabled) {
		button.classList.add("disabled");
		button.title = browser.i18n.getMessage("menu_action_not_applicable");
	}

	if(enabled && item.href) {
		button.href = item.href;
	}

	if(enabled && item.onclick) {
		button.addEventListener("click", e => {
			item.onclick(stateInfo);

			if(item.closeMenu !== false) {
				window.close();
			}
		});
	}

	return button;
}
