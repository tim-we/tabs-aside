import OverlayMenu from "../util/OverlayMenu.js";
import { Bookmark, Tab } from "../util/Types.js";
import * as Clipboard from "../util/Clipboard.js";
import SessionView from "./SessionView.js";
import { SessionCommand } from "../messages/Messages.js";
import TabView from "./TabViews/TabView.js";
import TabData from "../core/TabData.js";
import * as OptionsManager from "../options/OptionsManager.js";

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
				let emptyTab:Tab|null = null;

				if(await OptionsManager.getValue<boolean>("windowedSession")) {
					let wnd = await browser.windows.create();
					createProps.windowId = wnd.id;
					emptyTab = wnd.tabs[0];
				}

				await browser.tabs.create(createProps);

				if(emptyTab) {
					browser.tabs.remove(emptyTab.id);
				}

				SessionCommand.send("remove-tab", {
					sessionId: tabBookmark.parentId,
					tabBookmarkId: tabBookmark.id
				});
			});

			this.addItem("sidebar_tab_remove_from_session", () => {
				SessionCommand.send("remove-tab", {
					sessionId: tabBookmark.parentId,
					tabBookmarkId: tabBookmark.id
				});
			}, "options-menu-tab-remove");
		}
	}
}