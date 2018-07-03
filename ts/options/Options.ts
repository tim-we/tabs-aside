interface SimpleOption<S,T> {
	type: S;
	default: T;
	onchange?: (newValue:T, oldValue:T) => void;
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
	hidden?:boolean;
}

type Option = (SelectOption
	| SimpleOption<"boolean", boolean>
	| SimpleOption<"bookmark", string>)
	& GenericOption<any> // this is required for the OptionManager.ts
	& DisplayOptions;

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
