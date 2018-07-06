export interface GenericOption<S,T> {
	id: string;
	type: S;
	default: T;
}

export interface SelectOption extends GenericOption<"select", string> {
	options: string[];
}

interface DisplayOptions {
	hint?:boolean; // tooltip
	info?:boolean; // html
	hidden?:boolean;
}

export type BooleanOption = GenericOption<"boolean", boolean>;

export type BookmarkOption = GenericOption<"bookmark", string>;

export type Option = (SelectOption
	| BooleanOption
	| BookmarkOption)
	& DisplayOptions;