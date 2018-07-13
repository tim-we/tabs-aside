export interface Message {
	type: "SessionCommand" | "OptionUpdate";
	destination: "all" | "sidebar" | "background" | "menu";
}

export interface SessionCommand extends Message {
	type:"SessionCommand";
	destination: "background";
	cmd: "restore" | "restoreSingle";
	args:any[];
}

export interface OptionUpdateEvent extends Message {
	type: "OptionUpdate";
	destination: "all";
	key: string;
	newValue: any;
}