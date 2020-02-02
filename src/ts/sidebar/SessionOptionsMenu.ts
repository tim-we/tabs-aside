import OverlayMenu from "../util/OverlayMenu.js";
import SessionView from "./SessionView.js";
import * as OptionsManager from "../options/OptionsManager.js";
import { SessionCommand } from "../messages/Messages.js";
import { Bookmark } from "../util/Types.js";
import ModalWindow from "../util/ModalWindow.js";

let _i18n = browser.i18n.getMessage;

function date2str(date:Date|number):string {
	return date instanceof Date ?
		date.toISOString() :
		(new Date(date)).toISOString();
}

let activeSessions:boolean = true;

// needs to be loaded just once because sidebar will reload if this is changed
OptionsManager.getValue<boolean>("activeSessions").then(value => activeSessions = value);

export default class SessionOptionsMenu extends OverlayMenu {
	constructor(session:SessionView) {
		super();

		if(!activeSessions) {
			this.addItem("sidebar_session_restore_keep", () => {
				SessionCommand.send("restore", {
					sessionId: session.bookmarkId,
					keepBookmarks: true
				});
			}, "options-menu-restore-keep");
		}

		this.addItem("sidebar_session_rename", () => {
			session.editTitle();
		});

		this.addItem("sidebar_session_remove", async () => {
			const confirmationRequired:boolean = await OptionsManager.getValue("confirmSessionRemoval");

			if(confirmationRequired) {
				const confirmation:boolean = await ModalWindow.confirm(_i18n("sidebar_session_remove_confirm"));
				if(!confirmation) {
					return;
				}
			}

			if(activeSessions && session.isActive()) {
				let keep:boolean = await ModalWindow.confirm(_i18n("sidebar_session_remove_keep_tabs"));

				SessionCommand.send("remove", {
					sessionId: session.bookmarkId,
					keepTabs: keep
				});
			} else {
				SessionCommand.send("remove", {
					sessionId: session.bookmarkId,
					keepTabs: false
				});
			}
		}, "options-menu-remove-session");

		this.addItem("sidebar_session_details", async () => {
			let bookmark:Bookmark = (await browser.bookmarks.get(session.bookmarkId))[0];

			let modal = new ModalWindow();
			modal.addHeading(_i18n("sidebar_session_details_modal_title"));
			modal.addTable([
				[_i18n("sidebar_session_details_name"), bookmark.title],
				[_i18n("sidebar_session_details_id"), bookmark.id],
				[_i18n("sidebar_session_details_index"), ""+bookmark.index],
				[_i18n("sidebar_session_details_created"), date2str(bookmark.dateAdded)],
				[_i18n("sidebar_session_details_last_change"), date2str(bookmark.dateGroupModified)]
			]);
			modal.setButtons(["close"]);
			await modal.show();
		}, "options-menu-session-details");
	}
}