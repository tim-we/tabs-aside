import ActiveSession, { ActiveSessionData } from "./ActiveSession.js";
import { Tab, Bookmark, SessionId } from "../util/Types.js";
import { SessionCommand, SessionEvent, DataRequest, SessionContentUpdate } from "../messages/Messages.js";
import * as OptionsManager from "../options/OptionsManager.js";
import TabData from "./TabData.js";

let activeSessions:Map<SessionId, ActiveSession> = new Map();

export async function createSessionFromTabs(
	tabs:Tab[],
	title:string
):Promise<ActiveSession> {
	// check if there are any tabs to create a session from
	if(tabs.length === 0) {
		throw new Error("No tabs to create a session from. Sessions cannot be empty.");
	}

	// create bookmark folder
	let folder:Bookmark = await browser.bookmarks.create({
		parentId: await OptionsManager.getValue<string>("rootFolder"),
		title: title
	});

	// ActiveSession instance
	let session:ActiveSession = new ActiveSession(folder);

	// setup tabs
	await Promise.all(
		tabs.map(
			async tab => {
				let data:TabData = TabData.createFromTab(tab);

				// create a bookmark for the tab
				let bm:Bookmark = await browser.bookmarks.create(
					data.getBookmarkCreateDetails(session.bookmarkId)
				);

				await session.addExistingTab(tab, bm.id);
			}
		)
	);

	// add to activeSessions map
	activeSessions.set(session.bookmarkId, session);

	await SessionEvent.send(session.bookmarkId, "created");
	SessionEvent.send(session.bookmarkId, "activated");

	return session;
}

export function getActiveSessions():ActiveSessionData[] {
	return Array.from(activeSessions.values(), session => session.getData());
}

export function getActiveSession(sessionId:SessionId):ActiveSession {
	return activeSessions.get(sessionId)
}

export async function restore(sessionId:SessionId, keepBookmarks:boolean):Promise<void> {
	// sanity-check
	if (activeSessions.has(sessionId)) {
		throw new Error(`Session ${sessionId} is already active.`);
	}

	let session:ActiveSession = await ActiveSession.restoreAll(sessionId);
	activeSessions.set(sessionId, session);

	SessionEvent.send(sessionId, "activated");
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