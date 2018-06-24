import { ASMCommand } from "./SessionManager";

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