export interface Message {
	type: "SessionCommand" | "SessionEvent" | "DataRequest" | "OptionUpdate";
	destination: "all" | "sidebar" | "background" | "menu";
}

export interface SessionCommand extends Message {
	type:"SessionCommand";
	destination: "background";
	cmd: "restore" | "restoreSingle" | "set-aside";
	args:any[];
}

export interface DataRequest extends Message {
	type: "DataRequest";
	destination: "background";
	data: "active-sessions"
}

export interface SessionEvent extends Message {
	type: "SessionEvent";
	destination: "all" | "sidebar" | "menu";
	sessionId:string;
	event: "activated" | "set-aside";
}

export interface OptionUpdateEvent extends Message {
	type: "OptionUpdate";
	destination: "all";
	key: string;
	newValue: any;
}