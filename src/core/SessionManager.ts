import ActiveSession from "./ActiveSession";
import { ActiveSessionList } from "./ActiveSessionList";

export type ASMCommand = "openSession";

var activeSessions:ActiveSessionList = new ActiveSessionList();

var config = {
	newWindow: true,
	parentBookmarkId: ""
};

export function openSession(sessionId:string, newWindow = config.newWindow):Promise<void> {
	// sanity-check
	if (activeSessions.has(sessionId)) {
		return Promise.reject(`Session ${sessionId} is already active.`);
	}

	let p = Promise.resolve();
	let windowId:number = browser.windows.WINDOW_ID_CURRENT;

	// do we need a new window?
	if (newWindow) {
		p = browser.windows.create({
			type: "normal"
		}).then(w => {
			windowId = w.id as number;

			browser.sessions.setWindowValue(windowId, "sessionId", sessionId);
		});
	}

	return p.then(_ => {
		let session = new ActiveSession(sessionId, windowId);

		activeSessions.add(session);

		return session.openAll();
	});
}

export function createSessionFromTabs(title:string, tabs:browser.tabs.Tab[]):Promise<string> {
	if(tabs.length === 0) {
		return Promise.reject();
	}

	return browser.bookmarks.create({
		parentId: config.parentBookmarkId,
		title: title
	}).then(folder => {
		let sessionFolderId:string = folder.id;

		return Promise.all(
			tabs.map(
				tab => browser.bookmarks.create({
					parentId: sessionFolderId,
					title: title,
					url: tab.url
				})
			)
		).then(_ => {
			return sessionFolderId;
		});
	});
}

export function createSessionFromWindow(title:string, windowId?:number):Promise<string> {
	if(windowId === undefined) {
		windowId = browser.windows.WINDOW_ID_CURRENT;
	}

	// tab search query
	// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/query
	let query = {
		windowId: windowId
	};

	//TODO: filter
	return browser.tabs.query(query).then(tabs => createSessionFromTabs(title, tabs));
}