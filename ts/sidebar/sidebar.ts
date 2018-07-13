import * as TabViewFactory from "./TabViewFactory";
import * as OptionsManager from "../options/OptionsManager";
import { OptionUpdateEvent, Message, SessionEvent } from "../core/Messages";
import SessionView from "./SessionView";
import * as Search from "./Search";

type Bookmark = browser.bookmarks.BookmarkTreeNode;

// if one of these options changes reload the window
let optionsThatRequireReload:Set<string> = new Set<string>(["rootFolder", "sidebarTabLayout"]);

let rootId:string;

let sessionViews:Map<string, SessionView> = new Map();
let sessionContainer:HTMLElement;
let noSessionsInfo:HTMLElement;

// initialize...
Promise.all([
	OptionsManager.getValue<string>("rootFolder").then(v => {
		if(v) {
			rootId = v;
			return Promise.resolve();
		} else {
			return Promise.reject();
		}
	}),

	TabViewFactory.init(),

	new Promise(resolve => {
		document.addEventListener("DOMContentLoaded", () => {
			sessionContainer = document.getElementById("sessions");
			noSessionsInfo = document.getElementById("no-sessions");

			resolve();
		});
	})

]).then(async () => {
	let sessions:Bookmark[] = await browser.bookmarks.getChildren(rootId);

	sessions.forEach(sessionBookmark => {
		let view = new SessionView(sessionBookmark);

		sessionContainer.appendChild(view.getHTML());

		sessionViews.set(sessionBookmark.id, view);
	});

	if(sessions.length === 0) {
		noSessionsInfo.classList.add("show");
	} else {
		noSessionsInfo.classList.remove("show");
	}
}).then(() => {
	browser.runtime.onMessage.addListener(messageHandler);

	Search.init(rootId, sessionContainer);
}).catch(e => {
	console.error("[TA] " + e);

	document.body.innerHTML = "Error";
});

function messageHandler(message:Message) {
	if(message.type === "OptionUpdate") {
		let msg:OptionUpdateEvent = message as OptionUpdateEvent;

		if(optionsThatRequireReload.has(msg.key)) {
			window.location.reload();
		}
	} else if(message.type === "SessionEvent") {
		let msg:SessionEvent = message as SessionEvent;

		let sessionView:SessionView = sessionViews.get(msg.sessionId);
		if(!sessionView) { return; }

		if(msg.event === "activated") {
			sessionView.setActiveState(true);
		} else if(msg.event === "set-aside") {
			sessionView.setActiveState(false);
		}
	}
}

