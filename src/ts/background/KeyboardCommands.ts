import * as ActiveSessionManager from "../core/ActiveSessionManager.js";
import * as       SessionManager from "../core/SessionManager.js";

export function init() {
	browser.commands.onCommand.addListener(async command => {
		if (command === "tabs-aside") {

			let [tab] = await browser.tabs.query({
				active: true,
				currentWindow: true
			});

			if(tab === undefined) { return; }

			let session = ActiveSessionManager.getSessionFromTab(tab);

			if(session) {
				// tab is part of an active session -> set that session aside
				ActiveSessionManager.setAside(session.bookmarkId);
			} else {
				// set non-active tabs of this window aside (create session)
				SessionManager.createSessionFromWindow(true, tab.windowId);
			}
			
			//does not currently work in Firefox:
			//browser.sidebarAction.open();
		}
	});
}