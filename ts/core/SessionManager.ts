import ActiveSession, { ActiveSessionData } from "./ActiveSession";
import TabData from "./TabData";
import { SessionCommand, SessionEvent, Message } from "./Messages";

type SessionId = string;

let activeSessions:Map<SessionId, ActiveSession> = new Map();

export async function execCommand(cmd:SessionCommand):Promise<any> {
	let c = cmd.cmd;
	let sessionId:SessionId = cmd.args[0];

	if(c === "restore") {
		return await restore(sessionId);
	} else if(c === "restoreSingle") {
		//TODO (ActiveSession.restoreSingleTab)
	} else if(c === "set-aside") {
		return await setAside(sessionId);
	}
}

export function getActiveSessions():ActiveSessionData[] {
	return Array.from(activeSessions.values(), session => session.getData());
}

export async function restore(sessionId:SessionId):Promise<void> {
	// sanity-check
	if (activeSessions.has(sessionId)) {
		throw new Error(`Session ${sessionId} is already active.`);
	}

	let session:ActiveSession = await ActiveSession.restoreAll(sessionId);
	activeSessions.set(sessionId, session);

	SessionEvent.send(sessionId, "activated");
}

export async function createSessionFromTabs(
	tabs:browser.tabs.Tab[],
	title?:string,
	windowId?:number
):Promise<SessionId> {
	//TODO: title generator
	title = title ? title : "no title";

	// filter tabs that cannot be restored
	tabs = tabs.filter(tab => !TabData.createFromTab(tab).isPrivileged());

	let session:ActiveSession = await ActiveSession.createFromTabs(tabs, title, windowId);

	SessionEvent.send(session.bookmarkId, "activated");

	return session.bookmarkId;
}

export async function createSessionFromWindow(title?:string, windowId?:number):Promise<SessionId> {
	if(windowId === undefined) {
		windowId = browser.windows.WINDOW_ID_CURRENT;
	}

	// tab search query
	// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/query
	let query = {
		windowId: windowId
	};

	let tabs = await browser.tabs.query(query);
	
	return await createSessionFromTabs(tabs, title, windowId);
}

export async function setAside(sessionId:SessionId):Promise<void> {
	let session:ActiveSession = activeSessions.get(sessionId);

	if(!session) {
		throw new Error(`Cannot set aside non-active session ${sessionId}.`);
	}

	activeSessions.delete(sessionId);
	await session.setAside();

	SessionEvent.send(session.bookmarkId, "set-aside");
}