import { MenuItem } from "./MenuItemType.js";
import { SessionCommand } from "../messages/Messages.js";
import { SessionId } from "../util/Types.js";
import { getCurrentWindowId } from "../util/WebExtAPIHelpers.js";
import { getCommandByName } from "../util/WebExtAPIHelpers.js";

let showSessions:MenuItem, tabsAside:MenuItem, setAside:MenuItem;

let menuItems:MenuItem[] = [
	showSessions = {
		id: "show-sessions",
		icon: "tabs.svg",
		wideIcon: true,
		onclick: () => browser.sidebarAction.open()
	},
	tabsAside = {
		id: "tabs-aside",
		icon: "aside.svg",
		tooltip: true,
		onclick: async () => {
			// the sidebar can only be opened as
			// a direct response to a user event
			browser.sidebarAction.open();

			SessionCommand.send("create", {
				windowId: await getCurrentWindowId(),
				setAside: true
			});
		},
		isApplicable: (state) => state.availableTabs > 0,
		hide: (state) => state.currentSession !== undefined
	},
	setAside = {
		id: "set-aside",
		icon: "aside.svg",
		wideIcon: true,
		tooltip: true,
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
		isApplicable: (state) => state.availableTabs > 0,
		hide: (state) => state.availableTabs === 0
	},
	{
		id: "options",
		icon: "options-16.svg",
		optional: true,
		onclick: () => browser.runtime.openOptionsPage()
	}
];

(async () => {
	let sidebarCmd = await getCommandByName("_execute_sidebar_action");
	let asideCmd   = await getCommandByName("tabs-aside");

	showSessions.shortcut = sidebarCmd.shortcut;
	tabsAside.shortcut = asideCmd.shortcut;
	setAside.shortcut = tabsAside.shortcut;
})();

export default menuItems;