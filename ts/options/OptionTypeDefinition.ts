export interface GenericOption<S,T> {
	id: string;
	type: S;
	default: T;
	guard?: (newValue:T, currentValue:T) => Promise<boolean>;
}

export interface SelectOption extends GenericOption<"select", string> {
	options: string[];
}

type OptionsGroup = "appearance" | "keyboard";

interface DisplayOptions {
	hint?:boolean; // tooltip
	info?:boolean; // html
	hidden?:boolean;
	group?:OptionsGroup;
}

export type BooleanOption = GenericOption<"boolean", boolean>;

export type BookmarkOption = GenericOption<"bookmark", string>;

export type CommandOption = GenericOption<"command", string>;

export type Option = (SelectOption
					| CommandOption
					| BooleanOption
					| BookmarkOption)
					& DisplayOptions;