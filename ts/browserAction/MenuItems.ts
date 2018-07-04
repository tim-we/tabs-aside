import { MenuItem } from "./MenuItemType";

let menuItems:MenuItem[] = [
	{
		id: "tabs-aside",
		icon: "aside1.png",
		shortcut: "Shift+Alt+Q",
		onclick: () => {}
	},
	{
		id: "show-sessions",
		icon: "sessions.png",
		shortcut: "Alt+Q",
		onclick: () => browser.sidebarAction.open()
	},
	{
		id: "tab-selector",
		optional: true,
		onclick: () => {}
	},
	{
		id: "options",
		optional: true,
		onclick: () => browser.runtime.openOptionsPage()
	}
];

export default menuItems;