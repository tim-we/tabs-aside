import ActiveSession, { ActiveSessionData } from "./ActiveSession.js";
import { Tab, Bookmark, SessionId, Window } from "../util/Types.js";
import { SessionEvent, SessionContentUpdate } from "../messages/Messages.js";
import * as OptionsManager from "../options/OptionsManager.js";
import TabData from "./TabData.js";
import * as BrowserAction from "../browserAction/BrowserActionManager.js";

type TabBookmark = [number, SessionId];

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
		index: 0,
		parentId: await OptionsManager.getValue<string>("rootFolder"),
		title: title
	});

	// ActiveSession instance
	let session:ActiveSession = new ActiveSession(folder);

	let promises:Promise<void>[] = [];

	// add tabs to session
	for(const tab of tabs) {
		const data:TabData = TabData.createFromTab(tab);

		// create a bookmark for the tab
		const bm:Bookmark = await browser.bookmarks.create(
			data.getBookmarkCreateDetails(session.bookmarkId)
		);

		// we don't have to wait for this promise
		// in order to create new bookmarks
		promises.push(session.addExistingTab(tab, bm.id));
	}

	await Promise.all(promises);

	// add to activeSessions map
	activeSessions.set(session.bookmarkId, session);

	// start tab tracking
	session.start();

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

export function getSessionFromTab(tab:Tab):ActiveSession {
	for(let session of activeSessions.values()) {
		if(session.hasTab(tab.id)) {
			return session;
		}
	}

	return null;
}

export async function restore(sessionId:SessionId):Promise<void> {
	// sanity-check
	if (activeSessions.has(sessionId)) {
		throw new Error(`Session ${sessionId} is already active.`);
	}

	let session:ActiveSession = await ActiveSession.restoreAll(sessionId);
	activeSessions.set(sessionId, session);

	if((await browser.bookmarks.get(sessionId))[0].index > 0) {
		// move session to the top
		await browser.bookmarks.move(sessionId, { index: 0 });
		await SessionEvent.send(sessionId, "moved");
	}

	SessionEvent.send(sessionId, "activated");

	BrowserAction.updateBadge();
}

export async function restoreSingle(sessionId:SessionId, tabBookmark:Bookmark):Promise<void> {
	if(activeSessions.has(sessionId)) {
		activeSessions.get(sessionId).openBookmarkTab(tabBookmark, true);
	} else {
		let session:ActiveSession = await ActiveSession.restoreSingleTab(tabBookmark);
		activeSessions.set(sessionId, session);

		SessionEvent.send(sessionId, "activated");
		BrowserAction.updateBadge();
	}
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
	await session.setTabsOrWindowAside();

	SessionEvent.send(session.bookmarkId, "set-aside");
	BrowserAction.updateBadge();
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

export async function findActiveSessions():Promise<void> {
	let windows:Window[] = await browser.windows.getAll({windowTypes:["normal"]});
	let nonWindowSessions:Map<string, TabBookmark[]> = new Map();

	await Promise.all(
		windows.map(async (wnd) => {
			let windowId = wnd.id;
			let sessionId = (await browser.sessions.getWindowValue(wnd.id, "sessionID")) as string;

			if(sessionId) {
				await browser.bookmarks.get(sessionId).catch(e => {
					console.error("[TA] Unable to reactivate windowed session, bookmark is missing.", sessionId);
					sessionId = undefined;
				});

				// if session bookmark is missing skip the next part
				if(sessionId === undefined) {
					return Promise.resolve();
				}
			}

			if(sessionId) {
				// window seems to be an active session -> reactivate
				let session:ActiveSession = await ActiveSession.reactivateWindow(sessionId, windowId);
				activeSessions.set(session.bookmarkId, session);
			} else {
				// window could contain tabs of active sessions
				let tabs:Tab[] = await browser.tabs.query({windowId: windowId});

				// collect tabs that are part of active sessions
				await Promise.all(
					tabs.map(async (tab) => {
						let tabSessionId:string = (await browser.sessions.getTabValue(tab.id, "sessionID")) as string;

						// verify that session bookmark still exists
						if(tabSessionId) {
							await browser.bookmarks.get(tabSessionId).catch(e => {
								console.error("[TA] Unable to reactivate session, bookmark is missing.", tabSessionId);
								tabSessionId = undefined;
							});
						}
						
						// if the tab has tab values it must be part of an active session
						if(tabSessionId) {
							let bookmarkId:string = (await browser.sessions.getTabValue(tab.id, "bookmarkID")) as string;

							let session:TabBookmark[] = nonWindowSessions.get(tabSessionId) || [];
							session.push([tab.id, bookmarkId]);
							nonWindowSessions.set(tabSessionId, session);
						}
					})
				);
			}
		})
	);

	// reactivate non-window active sessions
	for(let data of nonWindowSessions.entries()) {
		let sessionId:SessionId = data[0];
		let tabData:TabBookmark[] = data[1];

		let session:ActiveSession = await ActiveSession.reactivateTabs(sessionId, tabData);
		activeSessions.set(session.bookmarkId, session);
	}

	if(activeSessions.size > 0) {
		console.log(`[TA] Reactivated ${activeSessions.size} previously active sessions.`);
	}

	BrowserAction.updateBadge();

	//TODO: make sure there is no race condition between this and the sidebar
}