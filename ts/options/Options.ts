import { Option } from "./OptionTypeDefinition";

let options:{[s:string]:Option} = {
	"smartTabLoading": {
		type: "boolean",
		default: true,
		hint: true
	},

	"activeSessions": {
		type: "boolean",
		default: true,
		hint: true
	},

	"windowedSession": {
		type: "boolean",
		default: true
	},
	
	"ignorePinned": {
		type: "boolean",
		default: true,
		hint: true
	},

	"browserActionIcon": {
		type: "select",
		options: ["dark", "light", "context"],
		default: "dark",
		info: true
	},

	"badgeCounter": {
		type: "boolean",
		default: true
	},

	"menuShowAll": {
		type: "boolean",
		default: false
	},

	"rootFolder": {
		type: "bookmark",
		default: null
	}
}

export default options;
