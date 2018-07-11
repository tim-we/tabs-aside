import { Option } from "./OptionTypeDefinition";

const manifest = browser.runtime.getManifest();

let optionsMap:Map<string, Option> = new Map<string, Option>();

(() => {
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
			id: "aside-command",
			type: "command",
			default: manifest.commands["tabs-aside"].suggested_key.default,
			hidden: true,
			group: "keyboard"
		},
		{
			id: "sidebar-command",
			type: "command",
			default: manifest.commands["_execute_sidebar_action"].suggested_key.default,
			hidden: true
		},
		{
			id: "rootFolder",
			type: "bookmark",
			default: null,
			group: "keyboard"
		}
	];

	optionsMap = options.reduce((m:Map<string, Option>, o:Option) => m.set(o.id, o), optionsMap);
})();


export default optionsMap;