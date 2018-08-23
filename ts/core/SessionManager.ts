import ActiveSession, { ActiveSessionData } from "./ActiveSession";
import TabData from "./TabData";
import { SessionCommand, SessionEvent, DataRequest } from "../messages/Messages";
import * as OptionsManager from "../options/OptionsManager";
import * as RestoreTabs from "./RestoreTabs";

type SessionId = string;
type Bookmark = browser.bookmarks.BookmarkTreeNode;
type Tab = browser.tabs.Tab;

let activeSessions:Map<SessionId, ActiveSession> = new Map();

export async function execCommand(cmd:SessionCommand):Promise<any> {
	let c = cmd.cmd;
	let sessionId:SessionId = cmd.args[0];

	if(c === "restore") {
		restore(sessionId);
	} else if(c === "restore-single") {
		let tabBookmarkId:string = cmd.args[1];
		restoreSingle(tabBookmarkId);
	} else if(c === "set-aside") {
		setAside(sessionId);
	} else if(c === "create") {
		let title:string = cmd.args[0];
		let tabIds:number[] = cmd.args[1];

		let tabs:Tab[] = await Promise.all(
			tabIds.map(tabId => browser.tabs.get(tabId))
		);

		createSessionFromTabs(tabs, title);
	}
}

export async function dataRequest(req:DataRequest):Promise<any> {
	if(req.data === "active-sessions") {
		return getActiveSessions();
	}
}

export function getActiveSessions():ActiveSessionData[] {
	return Array.from(activeSessions.values(), session => session.getData());
}

export async function restore(sessionId:SessionId, keepBookmarks:boolean = true):Promise<void> {
	// sanity-check
	if (activeSessions.has(sessionId)) {
		throw new Error(`Session ${sessionId} is already active.`);
	}

	let activeSessionsEnabled:boolean = await OptionsManager.getValue<boolean>("activeSessions");

	if(activeSessionsEnabled) {
		let session:ActiveSession = await ActiveSession.restoreAll(sessionId);
		activeSessions.set(sessionId, session);

		SessionEvent.send(sessionId, "activated");
	} else {
		await RestoreTabs.restore(sessionId);
		if(!keepBookmarks) {
			await browser.bookmarks.removeTree(sessionId);
			SessionEvent.send(sessionId, "removed");
		}
	}
}

export async function restoreSingle(tabBookmarkId:string) {
	let activeSessionsEnabled:boolean = await OptionsManager.getValue<boolean>("activeSessions");

	let tabBookmark:Bookmark = (await browser.bookmarks.get(tabBookmarkId))[0];
	let sessionId:SessionId = tabBookmark.parentId;

	if(activeSessionsEnabled) {
		let session:ActiveSession = activeSessions.get(sessionId);

		if(session) {
			session.openSingleTab(tabBookmark);
		} else {
			session = await ActiveSession.restoreSingleTab(tabBookmark);
			activeSessions.set(sessionId, session);

			SessionEvent.send(sessionId, "activated");
		}
	} else {
		let data:TabData = TabData.createFromBookmark(tabBookmark);
		browser.tabs.create(data.getTabCreateProperties());
	}
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

	let activeSessionsEnabled:boolean = await OptionsManager.getValue<boolean>("activeSessions");

	let sessionId:string;

	if(activeSessionsEnabled) {
		let session:ActiveSession = await ActiveSession.createFromTabs(tabs, title, windowId);
		sessionId = session.bookmarkId;
		activeSessions.set(sessionId, session);
	} else {
		//TODO
	}

	await SessionEvent.send(sessionId, "created");

	if(activeSessionsEnabled) {
		SessionEvent.send(sessionId, "activated");
	}

	return sessionId;
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