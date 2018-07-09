import { MenuItem } from "./MenuItemType";

let menuItems:MenuItem[] = [
	{
		id: "tabs-aside",
		icon: "aside1.png",
		shortcut: "Shift+Alt+Q",
		onclick: () => {}
	},
	{
		id: "create-session",
		tooltip: true,
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
		icon: "options-16.svg",
		optional: true,
		onclick: () => browser.runtime.openOptionsPage()
	}
];

export default menuItems;