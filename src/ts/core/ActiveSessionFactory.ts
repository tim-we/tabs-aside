import ActiveSession from "./ActiveSession";
import * as OptionsManager from "../options/OptionsManager";
import TabData from "./TabData";
import { Tab, Bookmark } from "../util/Types";

export async function createFromTabs(tabs:Tab[], title:string, windowsId?:number):Promise<ActiveSession> {
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

	return session;
}