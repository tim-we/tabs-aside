import ActiveSession from "./ActiveSession";
import * as OptionsManager from "../options/OptionsManager";
import TabData from "./TabData";

export type ASMCommand = "openSession";
type SessionId = string;
type Bookmark = browser.bookmarks.BookmarkTreeNode;

let activeSessions:Map<SessionId, ActiveSession> = new Map();

export async function restoreSession(sessionId:string):Promise<void> {
	// sanity-check
	if (activeSessions.has(sessionId)) {
		throw new Error(`Session ${sessionId} is already active.`);
	}

	let session:ActiveSession = await ActiveSession.restoreAll(sessionId);
	activeSessions.set(sessionId, session);
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

	return session.bookmarkId;
}

export async function createSessionFromWindow(title?:string, windowId?:number):Promise<string> {
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