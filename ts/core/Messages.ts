import { ASMCommand } from "./SessionManager";

export interface Message {
	type:string;
	destination: "all" | "sidebar" | "background" | "menu";
}

export interface ASMMessage extends Message {
	type:"ASM";
	destination: "background";
	cmd:ASMCommand;
	args:any[];
}

export interface OptionUpdateEvent extends Message {
	type: "OptionUpdate";
	destination: "all";
	key: string;
	newValue: any;
}