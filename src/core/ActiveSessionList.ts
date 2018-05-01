import { Session } from "./Session";

export class ActiveSessionList {

	private activeSessions:Map<string, Session> = new Map<string, Session>();
	private sessionTabIds:Set<number> = new Set<number>();

	public add(session:Session):void {
		this.activeSessions.set(session.getId(), session);

		session.tabs.forEach(tab => this.sessionTabIds.add(tab.id));
	}

	public remove(sessionId:string):void {
		let session = this.activeSessions.get(sessionId);

		if(session) {
			session.tabs.forEach(t => this.sessionTabIds.delete(t.id));
		}

		this.activeSessions.delete(sessionId);
	}

	public hasTab(tabId:number):boolean {
		return this.sessionTabIds.has(tabId);
	}

}