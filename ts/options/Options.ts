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
		id: "browserActionIcon",
		type: "select",
		options: ["dark", "light", "context"],
		default: "dark",
		info: true
	},
	{
		id: "badgeCounter",
		type: "boolean",
		default: true
	},
	{
		id: "menuShowAll",
		type: "boolean",
		default: false
	},
	{
		id: "rootFolder",
		type: "bookmark",
		default: null
	}
];

export default options;
