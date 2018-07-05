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

	if(showAll) {
		buttonsContainer.classList.add("showAll");
	} else {
		let more = createButton({
			id: "more",
			icon: "more-16.svg",
			closeMenu: false,
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
		let iconURL:string = "../../icons/menu/" + item.icon;
		button.style.setProperty("--iconURL", `url('${iconURL}')`);
		button.classList.add("icon");
	}

	if(item.shortcut) {
		button.dataset.shortcut = item.shortcut;
	}

	button.addEventListener("click", e => {
		item.onclick(e);

		if(item.closeMenu !== false) {
			window.close();
		}
	});

	return button;
}