import { Option } from "./OptionTypeDefinition";

let options:Option[] = [
	{
		id: "smartTabLoading",
		type: "boolean",
		default: true,
		hint: true
	},
	{
		id: "activeSessions",
		type: "boolean",
		default: true,
		hint: true
	},
	{
		id: "windowedSession",
		type: "boolean",
		default: true
	},
	{
		id: "ignorePinned",
		type: "boolean",
		default: true,
		hint: true
	},
	{
		id: "sidebarTabLayout",
		type: "select",
		options: ["simple-list"],
		default: "simple-list",
		hidden: true,
		group: "appearance"
	},
	{
		id: "browserActionIcon",
		type: "select",
		options: ["dark", "light", "context"],
		default: "dark",
		info: true,
		group: "appearance"
	},
	{
		id: "badgeCounter",
		type: "boolean",
		default: true,
		group: "appearance"
	},
	{
		id: "menuShowAll",
		type: "boolean",
		default: false,
		group: "appearance"
	},
	{
		id: "rootFolder",
		type: "bookmark",
		default: null
	}
];

export default options;
