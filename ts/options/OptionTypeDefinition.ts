export interface GenericOption<S,T> {
	id: string;
	type: S;
	default: T;
}

export interface SelectOption extends GenericOption<"select", string> {
	options: string[];
}

type OptionsGroup = "appearance";

interface DisplayOptions {
	hint?:boolean; // tooltip
	info?:boolean; // html
	hidden?:boolean;
	group?:OptionsGroup;
}

export type BooleanOption = GenericOption<"boolean", boolean>;

export type BookmarkOption = GenericOption<"bookmark", string>;

export type Option = (SelectOption
	| BooleanOption
	| BookmarkOption)
	& DisplayOptions;