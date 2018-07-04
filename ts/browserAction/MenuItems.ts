import { MenuItem } from "./MenuItemType";

let menuItems:MenuItem[] = [
	{
		id: "tabs-aside",
		shortcut: "Shift + Alt + Q",
		onclick: () => {}
	},
	{
		id: "show-sessions",
		shortcut: "Alt + Q",
		onclick: () => {}
	},
	{
		id: "tab-selector",
		optional: true,
		onclick: () => {}
	},
	{
		id: "options",
		optional: true,
		onclick: () => {}
	}
];

export default menuItems;