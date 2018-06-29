interface Option {
	type: "boolean" | "bookmark"
	default: any;
	hint?: boolean;
}

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
		default: true
	},

	"rootFolder": {
		type: "bookmark",
		default: null
	}
}

export default options;