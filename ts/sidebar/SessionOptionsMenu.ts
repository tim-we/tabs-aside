import OverlayMenu from "../util/OverlayMenu";
import SessionView from "./SessionView";

type Bookmark = browser.bookmarks.BookmarkTreeNode;

export default class SessionOptionsMenu extends OverlayMenu {
	constructor(session:SessionView) {
		super();

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