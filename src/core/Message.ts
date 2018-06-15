export interface Message {
	type:string;
	destination: "all" | "sidebar" | "background" | "menu";
}

export interface ASMMessage {
	type:"ASM";
	destination: "background";
	cmd:string;
	data:any;
}