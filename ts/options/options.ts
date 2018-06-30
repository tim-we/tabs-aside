interface BooleanOption {
	type: "boolean";
	default: boolean;
	hint?: boolean;
	onchange?: (newValue:boolean, oldValue?:boolean) => void;
}

interface BookmarkOption {
	type: "bookmark";
	default: string | null;
	hint?: boolean;
	onchange?: (newValue:string, oldValue?:string) => void;
}

type Option = BooleanOption | BookmarkOption;

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