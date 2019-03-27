import { MenuItem } from "./MenuItemType.js";
import * as OptionManager from "../options/OptionsManager.js";
import { SessionCommand } from "../messages/Messages.js";
import { SessionId } from "../util/Types.js";
import { getCurrentWindowId } from "../util/WebExtAPIHelpers.js";

const manifest = browser.runtime.getManifest();

let menuItems:MenuItem[] = [
	{
		id: "show-sessions",
		icon: "tabs.svg",
		wideIcon: true,
		shortcut: manifest.commands["_execute_sidebar_action"].suggested_key.default,
		onclick: () => browser.sidebarAction.open()
	},
	{
		id: "tabs-aside",
		icon: "aside.svg",
		tooltip: true,
		shortcut: manifest.commands["tabs-aside"].suggested_key.default,
		onclick: async () => {
			SessionCommand.send("create", {
				windowId: await getCurrentWindowId(),
				setAside: true
			});

			browser.sidebarAction.open();
		},
		isApplicable: (state) => state.freeTabs,
		hide: (state) => state.currentSession !== undefined
	},
	{
		id: "set-aside",
		icon: "aside.svg",
		wideIcon: true,
		tooltip: true,
		shortcut: manifest.commands["tabs-aside"].suggested_key.default,
		onclick: (state) => {
			let sessionId:SessionId = state.currentSession.bookmarkId;

			if(state.currentSession.windowId && state.previousWindowId !== browser.windows.WINDOW_ID_NONE) {
				browser.windows.update(state.previousWindowId, {focused:true});
				
				/* If we wait for the update promise we are not allowed
				 * to call sidebarAction.open() anymore :(
				 * So lets waste some time and hope it works...
				 */
				var n=0;
				for(let i=0; i<100; i++) {
					if(Math.random()<0.5) {
						n++;
					}
				}

				if(n>100 /*false*/) {
					throw new Error();
				}
			}
			
			browser.sidebarAction.open();
			SessionCommand.send("set-aside", {sessionId: sessionId});
		},
		hide: (state) => state.currentSession === undefined
	},
	{
		id: "create-session",
		tooltip: true,
		onclick: async () => {
			SessionCommand.send("create", {
				windowId: await getCurrentWindowId(),
				setAside: false
			});
		},
		isApplicable: (state) => state.freeTabs,
		hide: (state) => !state.freeTabs
	},
	{
		id: "tab-selector",
		optional: true,
		href: browser.runtime.getURL("html/menu/tab-selector.html")
	},
	{
		id: "options",
		icon: "options-16.svg",
		optional: true,
		onclick: () => browser.runtime.openOptionsPage()
	}
];

export default menuItems;