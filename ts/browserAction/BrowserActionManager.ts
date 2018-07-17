import * as OptionManager from "../options/OptionsManager";
import { Message, OptionUpdateEvent } from "../messages/Messages";
import * as MessageListener from "../messages/MessageListener";

let badgeColor:string = "#0A84FF";
let showBadge:boolean = true;

export async function init() {
	let icon:string = (await OptionManager.getValue<string>("browserActionIcon")) + ".svg";
	updateIcon(icon);

	browser.browserAction.setTitle({
		title: `Tabs Aside ${browser.runtime.getManifest().version}`
	});

	showBadge = await OptionManager.getValue<boolean>("badgeCounter");
	updateBadge();

	MessageListener.setDestination("background");
	MessageListener.add("OptionUpdate", (msg:OptionUpdateEvent) => {
		if(msg.key === "browserActionIcon") {
			let newIcon:string = msg.newValue + ".svg";
			updateIcon(newIcon);
		} else if(msg.key === "badgeCounter") {
			showBadge = msg.newValue as boolean;
			updateBadge();
		}
	});
}

async function updateBadge() {
	// TODO: get number of active session
	let n:number = /*await*/ 0;

	let text:string = (showBadge && n>0) ? n+"" : "";

	browser.browserAction.setBadgeText({ text: text });

	browser.browserAction.setBadgeBackgroundColor({
		color: badgeColor
	});
}

function updateIcon(newIcon:string):Promise<void> {
	let iconPath:string = "../img/browserAction/" + newIcon;

	return browser.browserAction.setIcon({
		path: {
			"16": iconPath,
			"32": iconPath
		}
	}).catch(e => console.error("[TA] Error updating icon:\n" + e));
}