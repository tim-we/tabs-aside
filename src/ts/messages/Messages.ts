import { ActiveSessionData } from "../core/ActiveSession.js";
import { attempt } from "../util/PromiseUtils.js";

export type MessageType =
	  "Ping"
	| "ExtensionCommand"
	| "SessionCommand"
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

export type CreateSessionArguments = {
	title?:string;
	windowId?:number;
	setAside:boolean;
	tabs?:number[];
};

export type ModifySessionArguments = {
	sessionId:string;
	tabBookmarkId?:string;
	keepBookmarks?:boolean;
	keepTabs?:boolean;
}

type ArgumentData = CreateSessionArguments | ModifySessionArguments;

export class SessionCommand extends Message {
	public readonly cmd:SessionCMD;
	public readonly argData:ArgumentData;

	constructor(cmd: SessionCMD, argData:ArgumentData) {
		super("SessionCommand", "background");

		this.cmd = cmd;
		this.argData = argData;
	}

	public static async send(cmd: SessionCMD, args:ArgumentData) {
		let m:Message = new SessionCommand(cmd, args);
		await attempt(browser.runtime.sendMessage(m));
	}
}

type DataDescriptor = "active-sessions" | "state-info" | "previous-window-id";

export class DataRequest extends Message {
	public readonly data: DataDescriptor;

	public constructor(data:DataDescriptor) {
		super("DataRequest", "background");

		this.data = data;
	}

	public static async send<T>(data:DataDescriptor):Promise<T> {
		let m:Message = new DataRequest(data);
		return browser.runtime.sendMessage(m);
	}
}

export interface StateInfoData {
	freeTabs:boolean;
	sessions:ActiveSessionData[];
	currentWindowSessions:ActiveSessionData[];
	currentSession:ActiveSessionData;
	previousWindowId:number;
}

type SessionEventType = "activated" | "set-aside" | "meta-update" | "content-update" | "removed" | "created" | "moved";

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
		await attempt(browser.runtime.sendMessage(m));
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
		await attempt(browser.runtime.sendMessage(m));
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
		await attempt(browser.runtime.sendMessage(m));
	}
}

export class BackgroundPing extends Message {
	public static readonly RESPONSE = "Pong";

	public constructor() {
		super("Ping", "background");
	}

	public static async send():Promise<void> {
		let m:Message = new BackgroundPing();
		let response:string|undefined = await browser.runtime.sendMessage(m);

		return (response === BackgroundPing.RESPONSE) ?
			Promise.resolve() :
			Promise.reject("Unexpected Ping response: '" + response + "'");
	}
}

export class ExtensionCommand extends Message {
	public readonly command:"reload" = "reload";

	public constructor(destination:MessageDestination, command:"reload") {
		super("ExtensionCommand", destination);
		this.command = command;
	}
}