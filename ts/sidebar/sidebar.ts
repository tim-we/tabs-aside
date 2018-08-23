import * as TabViewFactory from "./TabViewFactory";
import * as OptionsManager from "../options/OptionsManager";
import { OptionUpdateEvent, Message, SessionEvent, DataRequest } from "../messages/Messages";
import SessionView from "./SessionView";
import * as Search from "./Search";
import { ActiveSessionData } from "../core/ActiveSession";
import * as MessageListener from "../messages/MessageListener";

type Bookmark = browser.bookmarks.BookmarkTreeNode;

// if one of these options changes reload the window
let optionsThatRequireReload:Set<string> = new Set<string>([
	"activeSessions",
	"rootFolder",
	"sidebarTabLayout"
]);

let rootId:string;

let sessionViews:Map<string, SessionView> = new Map();
let activeSessions:Map<string, ActiveSessionData> = new Map();
let sessionContainer:HTMLElement;
let noSessionsInfo:HTMLElement;

// initialize...
MessageListener.setDestination("sidebar");
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
	let sessions:Bookmark[];

	// requesting the data simulaneously
	[sessions] = await Promise.all([
		browser.bookmarks.getChildren(rootId),
		getActiveSessions()
	]);

	// creating views
	sessions.forEach(sessionBookmark => addView(sessionBookmark));

}).then(() => {
	MessageListener.add("*", messageHandler);

	Search.init(rootId, sessionContainer);
}).catch(e => {
	console.error("[TA] " + e);

	document.body.innerHTML = "Error";

	MessageListener.add("*", () => window.location.reload());
});

function addView(sessionBookmark:Bookmark):void {
	if(sessionViews.has(sessionBookmark.id)) {
		return updateView(sessionBookmark.id, sessionBookmark);
	}

	// create new session view
	let view = new SessionView(sessionBookmark);
		
	// by default session are not active
	if(activeSessions.has(view.bookmarkId)) {
		view.setActiveState(true);
	}

	// add to document and internal DS
	sessionViews.set(sessionBookmark.id, view);
	sessionContainer.appendChild(view.getHTML());

	emptyCheck();
}

function updateView(sessionId:string, sessionBookmark:Bookmark):void {
	let view = sessionViews.get(sessionId);

	if(view) {
		view.update();
	}
}

function emptyCheck():void {
	if(sessionViews.size === 0) {
		noSessionsInfo.classList.add("show");
	} else {
		noSessionsInfo.classList.remove("show");
	}
}

/**
 * Populates the activeSessions Map
 */
async function getActiveSessions() {
	let response:ActiveSessionData[] = await DataRequest.send<ActiveSessionData[]>("active-sessions");

	activeSessions.clear();
	response.map(data => activeSessions.set(data.bookmarkId, data));
}

async function messageHandler(message:Message) {
	if(message.type === "OptionUpdate") {
		let msg:OptionUpdateEvent = message as OptionUpdateEvent;

		if(optionsThatRequireReload.has(msg.key)) {
			window.location.reload();
		}
	} else if(message.type === "SessionEvent") {
		let msg:SessionEvent = message as SessionEvent;

		let sessionView:SessionView = sessionViews.get(msg.sessionId);

		if(!sessionView) {
			if(msg.event === "created") {
				let sessionBookmark:Bookmark = (await browser.bookmarks.get(msg.sessionId))[0];
				addView(sessionBookmark);
			} else {
				// we can't modify a non-existing view so...
				return;
			}
		}

		if(msg.event === "activated") {
			sessionView.setActiveState(true);
		} else if(msg.event === "set-aside") {
			sessionView.setActiveState(false);
		} else if(msg.event === "meta-update") {
			sessionView.update();
		} else if(msg.event === "removed") {
			sessionView.getHTML().remove();
			sessionViews.delete(msg.sessionId);
			emptyCheck();
		}
	}
}

