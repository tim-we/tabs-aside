import OverlayMenu from "../util/OverlayMenu";
import SessionView from "./SessionView";
import * as OptionsManager from "../options/OptionsManager";

type Bookmark = browser.bookmarks.BookmarkTreeNode;

let activeSessions:boolean = true;

// needs to be loaded just once because sidebar will reload if this is changed
OptionsManager.getValue<boolean>("activeSessions").then(value => activeSessions = value);

export default class SessionOptionsMenu extends OverlayMenu {
	constructor(session:SessionView) {
		super();

		if(!activeSessions) {
			this.addItem("sidebar_session_restore_keep", () => {
				//TODO
				alert("Not yet implemented :/");
			});
		}

		this.addItem("sidebar_session_rename", () => {
			session.editTitle();
		});

		this.addItem("sidebar_session_remove", () => {
			//TODO
			alert("TODO: remove session ;)");
		}, "options-menu-remove-session");

		this.addItem("sidebar_session_details", async () => {
			let bookmark:Bookmark = (await browser.bookmarks.get(session.bookmarkId))[0];

			alert([
				"Name: " + bookmark.title,
				"Bookmark ID: " + bookmark.id,
				"Added:\n" + new Date(bookmark.dateAdded).toISOString(),
				"Last change:\n" + new Date(bookmark.dateGroupModified).toISOString()
			].join("\n"));
		}, "options-menu-session-details");
	}
}