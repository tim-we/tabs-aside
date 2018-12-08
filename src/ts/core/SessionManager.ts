import ActiveSession from "./ActiveSession.js";
import TabData from "./TabData.js";
import {
	SessionCommand,
	DataRequest,
	CreateSessionArguments as CSA,
	ModifySessionArguments as MSA
} from "../messages/Messages.js";
import * as OptionsManager from "../options/OptionsManager.js";
import { Tab, Bookmark, SessionId } from "../util/Types.js";

import * as  ActiveSessionManager from  "./ActiveSessionManager.js";
import * as ClassicSessionManager from "./ClassicSessionManager.js";

export async function execCommand(cmd:SessionCommand):Promise<any> {
	let c = cmd.cmd;
	let sessionId:SessionId;
	
	if((<MSA>cmd.argData).sessionId) {
		sessionId = (<MSA>cmd.argData).sessionId;
	}

	if(c === "restore") {
		let keepBookmarks:boolean = (<MSA> cmd.argData).keepBookmarks || false;
		restore(sessionId, keepBookmarks);
	} else if(c === "restore-single") {
		let tabBookmarkId:string = (<MSA> cmd.argData).tabBookmarkId;
		restoreSingle(tabBookmarkId);
	} else if(c === "set-aside") {
		ActiveSessionManager.setAside(sessionId);
	} else if(c === "create") {
		let data = (<CSA> cmd.argData);

		createSessionFromWindow(
			data.setAside,
			data.windowId,
			data.title
		);
	} else if(c === "remove") {
		let keepTabs:boolean = (<MSA> cmd.argData).keepTabs || false;
		removeSession(sessionId, keepTabs);
	} else if(c === "remove-tab") {
		let tabBookmarkId:string = (<MSA> cmd.argData).tabBookmarkId;
		removeTabFromSession(tabBookmarkId);
	}
}

export async function dataRequest(req:DataRequest):Promise<any> {
	if(req.data === "active-sessions") {
		return ActiveSessionManager.getActiveSessions();
	}
}

export async function restore(sessionId:SessionId, keepBookmarks:boolean):Promise<void> {
	let activeSessionsEnabled:boolean = await OptionsManager.getValue<boolean>("activeSessions");

	// delegate
	if(activeSessionsEnabled) {
		await ActiveSessionManager.restore(sessionId, keepBookmarks);
	} else {
		await ClassicSessionManager.restore(sessionId, keepBookmarks);
	}
}

export async function restoreSingle(tabBookmarkId:string) {
	let activeSessionsEnabled:boolean = await OptionsManager.getValue<boolean>("activeSessions");

	let tabBookmark:Bookmark = (await browser.bookmarks.get(tabBookmarkId))[0];
	let sessionId:SessionId = tabBookmark.parentId;
	let session:ActiveSession;

	if(activeSessionsEnabled && (session = ActiveSessionManager.getActiveSession(sessionId))) {
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
	setAside:boolean,
	title?:string
):Promise<SessionId> {
	title = title ? title : browser.i18n.getMessage("session_title_default");

	// filter tabs that cannot be restored
	tabs = tabs.filter(tab => !TabData.createFromTab(tab).isPrivileged());

	let activeSessionsEnabled:boolean = await OptionsManager.getValue<boolean>("activeSessions");

	let sessionId:string;

	if(activeSessionsEnabled) {
		let session:ActiveSession;
		session = await ActiveSessionManager.createSessionFromTabs(tabs, title);
		sessionId = session.bookmarkId;

		if(setAside) {
			ActiveSessionManager.setAside(sessionId);
		}
	} else {
		ClassicSessionManager.createSession(tabs, setAside, title);
	}

	return sessionId;
}

export async function createSessionFromWindow(setAside:boolean, windowId?:number, title?:string):Promise<SessionId> {
	if(windowId === undefined) {
		windowId = browser.windows.WINDOW_ID_CURRENT;
	}

	// tab search query
	// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/query
	let query = {
		windowId: windowId
	};

	let tabs = await browser.tabs.query(query);

	//TODO: remove tabs that are part of an active session
	
	let sessionId:SessionId = await createSessionFromTabs(tabs, setAside, title);

	return sessionId;
}

/**
 * Removes a session.
 * @param sessionId Bookmark id of the session folder.
 * @param keepTabs Whether to keep the tabs if the session is active.
 */
export async function removeSession(sessionId:SessionId, keepTabs:boolean = false):Promise<void> {
	// a simple check if activeSessions are enabled is not sufficient here
	// because there could still be active sessions left open
	let session:ActiveSession = ActiveSessionManager.getActiveSession(sessionId);

	if(session) {
		ActiveSessionManager.removeSession(sessionId, keepTabs);
	} else {
		ClassicSessionManager.removeSession(sessionId);
	}
}

export async function removeTabFromSession(tabBookmarkId:string):Promise<void> {
	let tabBookmark:Bookmark = (await browser.bookmarks.get(tabBookmarkId))[0];
	let sessionId:string = tabBookmark.parentId;
	let session:ActiveSession = ActiveSessionManager.getActiveSession(sessionId);
	
	if(session) {
		// session is active
		console.error("[TA] Removing a tab from an active session is currently not supported.");
		return;
	} else {
		// session is not active
		ClassicSessionManager.removeTabFromSession(tabBookmark);
	}
}