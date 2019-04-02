import * as OptionsManager from "../options/OptionsManager.js";
import TabData from "./TabData.js";
import { Tab, Window, Bookmark, SessionId } from "../util/Types.js";
import { SessionEvent, SessionContentUpdate } from "../messages/Messages.js";

export async function createSession(
	tabs:Tab[],
	setAside:boolean,
	sessionName?:string
) {
	let rootFolderId:string = await OptionsManager.getValue<string>("rootFolder");

	let sessionBookmark:Bookmark = await browser.bookmarks.create({
		title:sessionName||"session",
		type: "folder",
		parentId: rootFolderId
	});

	let parentId:string = sessionBookmark.id;

	for(let i=0; i<tabs.length; i++) {
		let tab:Tab = tabs[i];
		let data:TabData = TabData.createFromTab(tab);

		if(!data.isPrivileged()) {
			// create bookmark & close tab
			await Promise.all([
				browser.bookmarks.create(data.getBookmarkCreateDetails(parentId)),
				setAside ? browser.tabs.remove(tab.id) : Promise.resolve()
			]);
		}
	}

	await SessionEvent.send(sessionBookmark.id, "created");
}

/**
 * Classic restore function (just opens tabs, no active session)
 * @param sessionId
 */
export async function restore(sessionId:SessionId, keepBookmarks:boolean):Promise<void> {
	let tabBookmark:Bookmark,
		openInNewWindow:boolean;

	// let the browser handle these requests simultaneously
	[[tabBookmark], openInNewWindow] = await Promise.all([
		browser.bookmarks.getSubTree(sessionId),
		OptionsManager.getValue<boolean>("windowedSession")
	]);

	let tabBookmarks:Bookmark[] = tabBookmark.children;
	let newTabId:number;

	if(openInNewWindow) {
		// create window for the tabs
		let wnd:Window = await browser.windows.create();
		newTabId = wnd.tabs[0].id;

		if(keepBookmarks) {
			browser.sessions.setWindowValue(wnd.id, "sessionID", this.bookmarkId);
		} else {
			browser.sessions.setWindowValue(wnd.id, "sessionTitle", tabBookmark.title);
		}
	}

	// create tabs
	await Promise.all(
		tabBookmarks.map(bm => {
			let data:TabData = TabData.createFromBookmark(bm);

			return browser.tabs.create(
				data.getTabCreateProperties()
			);
		})
	);

	// remove "new tab" tab that gets created automatically when creating a new window
	if(newTabId) {
		browser.tabs.remove(newTabId);
	}

	// (optional) remove bookmarks
	if(!keepBookmarks) {
		await browser.bookmarks.removeTree(sessionId);
		SessionEvent.send(sessionId, "removed");
	}
}

export async function removeSession(sessionId:SessionId):Promise<void> {
	// remove bookmarks
	await browser.bookmarks.removeTree(sessionId);

	// update views
	SessionEvent.send(sessionId, "removed");
}

export async function removeTabFromSession(tabBookmark:Bookmark):Promise<void> {
	let sessionId:string = tabBookmark.parentId;

	await browser.bookmarks.remove(tabBookmark.id);

	let tabs:Bookmark[] = await browser.bookmarks.getChildren(sessionId);

	if(tabs.length === 0) {
		removeSession(sessionId);
	} else {
		// update views
		SessionContentUpdate.send(sessionId);
	}
}