export interface GenericOption<S,T> {
	type: S;
	default: T;
}

export interface SelectOption {
	type: "select";
	default: string;
	options: string[];
}

interface DisplayOptions {
	hint?:boolean; // tooltip
	info?:boolean; // html
	hidden?:boolean;
}

export type Option = (SelectOption
	| GenericOption<"boolean", boolean>
	| GenericOption<"bookmark", string>)
	& DisplayOptions;