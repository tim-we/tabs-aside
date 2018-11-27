import * as OptionsManager from "../options/OptionsManager.js";
import TabData from "./TabData.js";
import { Tab, Bookmark } from "../util/Types.js";

export async function tabsAside(
	tabs:Tab[],
	sessionName?:string
) {
	let rootFolderId:string = await OptionsManager.getValue<string>("rootFolder");

	let sessionBookmark:Bookmark = await browser.bookmarks.create({
		title:sessionName||"session",
		type: "folder",
		parentId: rootFolderId
	});

	let parentId:string = sessionBookmark.id;

	let n = 0;

	for(let i=0; i<tabs.length; i++) {
		let tab:Tab = tabs[i];
		let data:TabData = TabData.createFromTab(tab);

		if(!data.isPrivileged()) {
			// create bookmark & close tab
			await Promise.all([
				browser.bookmarks.create(data.getBookmarkCreateDetails(parentId)),
				browser.tabs.remove(tab.id)
			]);
		}
	}
}