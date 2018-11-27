import { Option } from "../OptionTypeDefinition.js";
import * as OptionsManager from "../OptionsManager.js";
import { OptionUpdateEvent, Message } from "../../messages/Messages.js";

let optionIdFolderViewMap:Map<string, HTMLDivElement> = new Map<string, HTMLDivElement>();

browser.runtime.onMessage.addListener((message:Message) => {
	if(message.type === "OptionUpdate") {
		let msg:OptionUpdateEvent = message as OptionUpdateEvent;

		if(optionIdFolderViewMap.has(msg.key)) {
			let view:HTMLDivElement = optionIdFolderViewMap.get(msg.key);

			updateFolderView(view, msg.newValue);
		}
	}
});

export function create(
	row:HTMLDivElement,
	i:number,
	option:Option, bookmarkId:string,
	i18nMessageName:string,
	
) {
	let folderView:HTMLDivElement = document.createElement("div");
	folderView.title = browser.i18n.getMessage("bookmarkFolderSelector_tooltip");
	folderView.id = "bmBox" + i;
	folderView.setAttribute("data-bmId", "");
	folderView.classList.add("bookmarkFolderView");

	updateFolderView(folderView, bookmarkId);

	folderView.addEventListener("click", async () => {
		let url = "../html/bookmark-selector.html?fpreset=" + encodeURIComponent("Tabs Aside");
		url += "&option=" + encodeURIComponent(option.id);
		let bmId:string = folderView.getAttribute("data-bmId") || "";

		if(bmId) {
			url += "&selected=" + bmId;
		}

		let bmsWindow:browser.windows.Window = await browser.windows.create({
			//focused: true, // not supported by FF
			allowScriptsToClose: true,
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
	
	optionIdFolderViewMap.set(option.id, folderView);
}

async function updateFolderView(view:HTMLDivElement, bookmarkId:string) {
	if(bookmarkId) {
		let title:string = (await browser.bookmarks.get(bookmarkId))[0].title;

		view.innerText = title;
	} else {
		view.innerText = "-";
	}

	view.setAttribute("data-bmId", bookmarkId);
}