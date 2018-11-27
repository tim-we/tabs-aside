import ActiveSession, { ActiveSessionData } from "./ActiveSession.js";
import * as ActiveSessionFactory from "./ActiveSessionFactory.js";
import TabData from "./TabData.js";
import { SessionCommand, SessionEvent, DataRequest, SessionContentUpdate } from "../messages/Messages.js";
import * as OptionsManager from "../options/OptionsManager.js";
import * as RestoreTabs from "./RestoreTabs.js";
import { Tab, Bookmark, SessionId } from "../util/Types.js";

let activeSessions:Map<SessionId, ActiveSession> = new Map();

export async function execCommand(cmd:SessionCommand):Promise<any> {
	let c = cmd.cmd;
	let sessionId:SessionId = cmd.args[0];

	if(c === "restore") {
		let keepBookmarks:boolean = cmd.args.length > 1 ? cmd.args[1] : false;
		restore(sessionId, keepBookmarks);
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
	} else if(c === "remove") {
		removeSession(sessionId, cmd.args[1] || false);
	} else if(c === "remove-tab") {
		let tabBookmarkId:string = cmd.args[0];
		removeTabFromSession(tabBookmarkId);
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

export async function restore(sessionId:SessionId, keepBookmarks:boolean):Promise<void> {
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
	let session:ActiveSession;

	if(activeSessionsEnabled && (session = activeSessions.get(sessionId))) {
		// if session is already partially active add tab to active session
		session.openBookmarkTab(tabBookmark);
	} else {
		// create a new tab (no active session) otherwise
		let data:TabData = TabData.createFromBookmark(tabBookmark);
		browser.tabs.create(data.getTabCreateProperties(true));
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
		let session:ActiveSession = await ActiveSessionFactory.createFromTabs(tabs, title, windowId);
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

/**
 * Sets an active session aside.
 * @param sessionId Bookmark id of the session folder.
 */
export async function setAside(sessionId:SessionId):Promise<void> {
	let session:ActiveSession = activeSessions.get(sessionId);

	if(!session) {
		throw new Error(`Cannot set aside non-active session ${sessionId}.`);
	}

	activeSessions.delete(sessionId);
	await session.setAside();

	SessionEvent.send(session.bookmarkId, "set-aside");
}

/**
 * Removes a session.
 * @param sessionId Bookmark id of the session folder.
 * @param keepTabs Whether to keep the tabs if the session is active.
 */
export async function removeSession(sessionId:SessionId, keepTabs:boolean = false):Promise<void> {
	let session:ActiveSession = activeSessions.get(sessionId);

	if(session) {
		if(keepTabs) {
			await session.free();
		}

		await setAside(sessionId);
	}

	// remove bookmarks
	await browser.bookmarks.removeTree(sessionId);

	// update views
	SessionEvent.send(sessionId, "removed");
}

export async function removeTabFromSession(tabBookmarkId:string):Promise<void> {
	let tabBookmark:Bookmark = (await browser.bookmarks.get(tabBookmarkId))[0];
	let sessionId:string = tabBookmark.parentId;
	let session:ActiveSession = activeSessions.get(sessionId);
	
	if(session) {
		console.error("[TA] Removing a tab from an active session is currently not supported.");
		return;
	}

	await browser.bookmarks.remove(tabBookmark.id);

	let tabs:Bookmark[] = await browser.bookmarks.getChildren(sessionId);

	if(tabs.length === 0) {
		removeSession(sessionId, false);
	} else {
		// update views
		SessionContentUpdate.send(sessionId);
	}
}