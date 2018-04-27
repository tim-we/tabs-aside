import {SessionManager} from "../core/SessionManager";

browser.browserAction.setBadgeBackgroundColor({
	color: "#0A84FF"
});

browser.browserAction.setTitle({
	title: `Tabs Aside ${browser.runtime.getManifest().version}`
});

var sessionManager = new SessionManager();