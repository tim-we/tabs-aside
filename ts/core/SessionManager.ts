import ActiveSession from "./ActiveSession";
import * as OptionsManager from "../options/OptionsManager";
import TabData from "./TabData";

export type ASMCommand = "openSession";
type SessionId = string;
type Bookmark = browser.bookmarks.BookmarkTreeNode;

let activeSessions:Map<SessionId, ActiveSession> = new Map();

export async function restoreSession(sessionId:string, ):Promise<void> {
	// sanity-check
	if (activeSessions.has(sessionId)) {
		throw new Error(`Session ${sessionId} is already active.`);
	}

	let session:ActiveSession = await ActiveSession.restoreAll(sessionId);
	activeSessions.set(sessionId, session);
}

/*export async function createSessionFromTabs(tabs:browser.tabs.Tab[], title?:string):Promise<SessionId> {
	if(tabs.length === 0) {
		throw new Error("Illegal argument. Sessions can not be empty.");
	}

	let folder:Bookmark = await browser.bookmarks.create({
		parentId: await OptionsManager.getValue<string>("rootFolder"),
		title: title
	});
	
	let sessionId:string = folder.id;

	await Promise.all(
		tabs.map(
			async tab => {
				let data:TabData = TabData.createFromTab(tab);

				if(data.isPrivileged()) {
					return;
				}

				await browser.bookmarks.create(
					data.getBookmarkCreateDetails(sessionId)
				);
			}
		)
	);

	return sessionId;
}*/

/*export function createSessionFromWindow(title?:string, windowId?:number):Promise<string> {
	if(windowId === undefined) {
		windowId = browser.windows.WINDOW_ID_CURRENT;
	}

	// tab search query
	// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/query
	let query = {
		windowId: windowId
	};

	return browser.tabs.query(query).then(tabs => createSessionFromTabs(title, tabs));
}*/