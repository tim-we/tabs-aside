import * as OptionManager from "../options/OptionsManager.js";
import { Message, OptionUpdateEvent } from "../messages/Messages.js";
import * as MessageListener from "../messages/MessageListener.js";
import * as ActiveSessionManager from "../core/ActiveSessionManager.js";

let badgeColor:string = "#0A84FF";

export async function init() {
	if(await OptionManager.getValue<string>("browserActionContextIcon")) {
		updateIcon("context.svg");
	}

	browser.browserAction.setTitle({
		title: `Tabs Aside ${browser.runtime.getManifest().version}`
	});

	updateBadge();

	MessageListener.setDestination("background");
	MessageListener.add("OptionUpdate", (msg:OptionUpdateEvent) => {
		if(msg.key === "browserActionContextIcon") {
			if(msg.newValue as boolean) {
				updateIcon("context.svg");
			} else {
				updateIcon();
			}
		}
	});
}

export async function updateBadge() {
	let sessions = ActiveSessionManager.getActiveSessions();
	let n:number = sessions.filter(session => !session.windowId).length;

	let text:string = (n>0) ? n+"" : "";

	// set global badge color
	browser.browserAction.setBadgeBackgroundColor({
		color: badgeColor
	});

	await browser.browserAction.setBadgeText({ text: text });

	// get window ids of active sessions
	let windows = sessions.reduce(
		(wnds, session) => {
			if(session.windowId) {
				wnds.add(session.windowId);
			}
			return wnds;
		},
		new Set<number>()
	);
	
	// hide badge on active session windows
	windows.forEach(windowId => browser.browserAction.setBadgeText({
		text: "",
		windowId: windowId
	}));
}

function updateIcon(newIcon?:string):Promise<void> {
	let p:Promise<void>;

	if(newIcon) {
		let iconPath:string = "../img/browserAction/" + newIcon;

		p = browser.browserAction.setIcon({
			path: {
				"16": iconPath,
				"32": iconPath
			}
		});
	} else {
		p = browser.browserAction.setIcon({});
	}

	return p.catch(e => console.error("[TA] Error updating icon:\n" + e));
}

export function showSetup():Promise<void> {
	return browser.browserAction.setPopup({
		popup: browser.runtime.getURL("html/menu/setup.html")
	}).then(
		_ => {
			// delay badge text update because otherwise it sometimes does not do anything
			window.setTimeout(
				_ => browser.browserAction.setBadgeText({text:"!"}), 
				750
			);
		}
	);
}
