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

interface SelectOption<T> {
	type: "select";
	default: T;
	options: T[];
	onchange?: (newValue:T, oldValue?:T) => void;
}

interface DisplayOptions {
	hint?:boolean; // tooltip
	info?:boolean; // html
}

type Option = (BooleanOption | BookmarkOption | SelectOption<string>) & DisplayOptions;

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
		onchange: (newValue:string) => {

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