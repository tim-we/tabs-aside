import OverlayMenu from "../util/OverlayMenu";
import { Bookmark } from "../util/Types";
import * as Clipboard from "../util/Clipboard";
import SessionView from "./SessionView";
import { SessionCommand } from "../messages/Messages";
import TabView from "./TabViews/TabView";
import TabData from "../core/TabData";

let _i18n = browser.i18n.getMessage;

export default class TabContextMenu extends OverlayMenu {
	constructor(session:SessionView, tabView:TabView, tabBookmark:Bookmark) {
		super();

		this.addItem("sidebar_tab_copy_url", () => {
			Clipboard.copy(tabBookmark.url);
		}, "options-menu-tab-copy");

		if(!session.isActive()) {
			this.addItem("sidebar_tab_open_remove", async () => {
				let createProps = TabData.createFromBookmark(tabBookmark).getTabCreateProperties(true);

				//TODO: find a window that is not associated with a session
				await browser.tabs.create(createProps);

				SessionCommand.send("remove-tab", [tabBookmark.id]);
			});

			this.addItem("sidebar_tab_remove_from_session", () => {
				SessionCommand.send("remove-tab", [tabBookmark.id]);
			}, "options-menu-tab-remove");
		}
	}
}