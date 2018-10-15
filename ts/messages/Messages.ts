export type MessageType = 
	  "SessionCommand"
	| "SessionEvent"
	| "DataRequest"
	| "OptionUpdate";

export type MessageDestination = 
	  "all"
	| "sidebar"
	| "background"
	| "menu"
	| "options-page"
	| "tab-selector";

export class Message {
	public readonly type: MessageType;

	public readonly destination: MessageDestination;

	protected constructor(type:MessageType, dest:MessageDestination) {
		this.type = type;
		this.destination = dest;
	}
}

type SessionCMD = "restore" | "restore-single" | "set-aside" | "create" | "remove" | "remove-tab";

export class SessionCommand extends Message {
	public readonly cmd:SessionCMD;
	public readonly args:any[];

	constructor(cmd: SessionCMD, args:any[]) {
		super("SessionCommand", "background");

		this.cmd = cmd;
		this.args = args;
	}

	public static async send(cmd: SessionCMD, args:any[]) {
		let m:Message = new SessionCommand(cmd, args);
		await browser.runtime.sendMessage(m);
	}
}

type DataDescriptor = "active-sessions";
export class DataRequest extends Message {
	public readonly data: DataDescriptor;

	public constructor(data:DataDescriptor) {
		super("DataRequest", "background");

		this.data = data;
	}

	public static async send<T>(data:DataDescriptor):Promise<T> {
		let m:Message = new DataRequest(data);
		return await browser.runtime.sendMessage(m);
	}
}

type SessionEventType = "activated" | "set-aside" | "meta-update" | "content-update" | "removed" | "created";

export class SessionEvent extends Message {
	public readonly sessionId:string;
	public readonly event: SessionEventType;

	public constructor(sessionId:string, event:SessionEventType) {
		super("SessionEvent", "all");

		this.sessionId = sessionId;
		this.event = event;
	}

	public static async send(sessionId:string, event:SessionEventType) {
		let m:Message = new SessionEvent(sessionId, event);
		await browser.runtime.sendMessage(m);
	}
}

export class SessionContentUpdate extends SessionEvent {
	public readonly changedTabs:string[] = [];
	public readonly addedTabs:string[] = [];
	public readonly removedTabs:string[] = [];

	public constructor(sessionId:string) {
		super(sessionId, "content-update");
	}

	public static async send(sessionId:string) {
		let m:Message = new SessionContentUpdate(sessionId);
		await browser.runtime.sendMessage(m);
	}
}

export class OptionUpdateEvent extends Message {
	public readonly key: string;
	public readonly newValue: any;

	public constructor(key:string, newValue:any) {
		super("OptionUpdate", "all");

		this.key = key;
		this.newValue = newValue;
	}

	public static async send(key:string, newValue:any) {
		let m:Message = new OptionUpdateEvent(key, newValue);
		await browser.runtime.sendMessage(m);
	}
}