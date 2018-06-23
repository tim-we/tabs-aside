import { ASMCommand } from "./ActiveSessionManager";

export interface Message {
	type:string;
	destination: "all" | "sidebar" | "background" | "menu";
}

export interface ASMMessage {
	type:"ASM";
	destination: "background";
	cmd:ASMCommand;
	args:any[];
}