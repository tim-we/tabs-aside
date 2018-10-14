import OverlayMenu from "../util/OverlayMenu";
import { Bookmark } from "../util/Types";
import * as Clipboard from "../util/Clipboard";

let _i18n = browser.i18n.getMessage;

export default class TabContextMenu extends OverlayMenu {
	constructor(tabBookmark:Bookmark) {
		super();

		// copy url
		this.addItem("sidebar_tab_copy_url", () => {
			Clipboard.copy(tabBookmark.url);
		});

		this.addItem("sidebar_tab_remove_from_session", () => {
			alert("TODO: remove tab from session");
			//TODO
		});
	}
}