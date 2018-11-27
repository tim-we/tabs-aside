import * as OptionsManager from "../options/OptionsManager.js";
import TabData from "./TabData.js";
import { Window, Bookmark, SessionId } from "../util/Types.js";

/**
 * Classic restore function (just opens tabs, no active session)
 * @param sessionId
 */
export async function restore(sessionId:SessionId):Promise<void> {
	let tabBookmarks:Bookmark[],
		openInNewWindow:boolean;

	// let the browser handle these requests simultaneously
	[tabBookmarks, openInNewWindow] = await Promise.all([
		browser.bookmarks.getChildren(sessionId),
		OptionsManager.getValue<boolean>("windowedSession")
	]);

	let windowId:number;
	let newTabId:number;

	if(openInNewWindow) {
		// create window for the tabs
		let wnd:Window = await browser.windows.create();
		windowId = wnd.id;
		newTabId = wnd.tabs[0].id;
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
}