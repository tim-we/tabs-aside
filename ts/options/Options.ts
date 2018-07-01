interface BooleanOption {
	type: "boolean";
	default: boolean;
	onchange?: (newValue:boolean, oldValue?:boolean) => void;
}

interface BookmarkOption {
	type: "bookmark";
	default: string | null;
	onchange?: (newValue:string, oldValue?:string) => void;
}

interface SelectOption {
	type: "select";
	default: string;
	options: string[];
	onchange?: (newValue:string, oldValue?:string) => void;
}

interface GenericOption<T> {
	default: T;
	onchange?: (newValue:T, oldValue?:T) => void;
}

interface DisplayOptions {
	hint?:boolean; // tooltip
	info?:boolean; // html
}

type Option = (BooleanOption | BookmarkOption | SelectOption) & GenericOption<any> & DisplayOptions;

let options:{[s:string]:Option} = {
	"windowedSession": {
		type: "boolean",
		default: true
	},

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
	
	"ignorePinned": {
		type: "boolean",
		default: true,
		hint: true
	},

	"browserActionIcon": {
		type: "select",
		options: ["dark", "light", "context"],
		default: "dark",
		info: true,
		onchange: (newIcon:string) => {
			let iconPath:string = "../icons/browserAction/" + newIcon + ".svg";

			browser.browserAction.setIcon({
				path: {
					"16": iconPath,
					"32": iconPath
				}
			}).catch(e => console.error("[TA] " + e));
		}
	},

	"badgeCounter": {
		type: "boolean",
		default: true,
		onchange: (newValue:boolean) => {
			
		}
	},

	"rootFolder": {
		type: "bookmark",
		default: null
	}
}

export default options;
