import ActiveSession from "./ActiveSession";
import { ActiveSessionList } from "./ActiveSessionList";

export type ASMCommand = "openSession";

var activeSessions:ActiveSessionList = new ActiveSessionList();

var config = {
	newWindow: true
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