import * as OptionsManager from "../options/OptionsManager";
import TabData from "./TabData";

type Bookmark = browser.bookmarks.BookmarkTreeNode;
type Window = browser.windows.Window;

/**
 * Classic restore function (just opens tabs, no active session)
 * @param sessionId
 */
export async function restore(sessionId:string):Promise<void> {
	let tabBookmarks:Bookmark[],
		openInNewWindow:boolean;

	// let the browser handle these requests simultaneously
	[tabBookmarks, openInNewWindow] = await Promise.all([
		browser.bookmarks.getChildren(sessionId),
		OptionsManager.getValue<boolean>("windowedSession")
	]);

	let windowId:number;

	if(openInNewWindow) {
		// create window for the tabs
		let wnd:Window = await browser.windows.create();
		windowId = wnd.id;
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
}