export interface GenericOption<S extends string, T> {
    id: string;
    type: S;
    default: T;
}

export interface SelectOption extends GenericOption<"select", string> {
    options: string[];
}

type OptionsGroup = "appearance" | "core";

interface DisplayOptions {
    hint?:boolean; // tooltip
    info?:boolean; // html
    hidden?:boolean;
    group?:OptionsGroup;
    activeOnly?:boolean; // requires active sessions to be on/off (true/false)
}

export type BooleanOption  = GenericOption<"boolean", boolean>;
export type BookmarkOption = GenericOption<"bookmark", string>;
export type StringOption   = GenericOption<"string",   string>;

export type Option = (SelectOption
                    | BooleanOption
                    | BookmarkOption
                    | StringOption)
                    & DisplayOptions;
