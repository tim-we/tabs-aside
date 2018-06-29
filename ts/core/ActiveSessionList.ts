import ActiveSession from "./ActiveSession";

export class ActiveSessionList {

	private activeSessions:Map<string, ActiveSession> = new Map<string, ActiveSession>();
	private sessionTabIds:Set<number> = new Set<number>();

	public add(session:ActiveSession):void {
		this.activeSessions.set(session.getId(), session);

		session.getTabIds().forEach(tabId => this.sessionTabIds.add(tabId));
	}

	public remove(sessionId:string):void {
		let session = this.activeSessions.get(sessionId);

		if(session) {
			session.getTabIds().forEach(tabId => this.sessionTabIds.delete(tabId));
		}

		this.activeSessions.delete(sessionId);
	}

	public hasTab(tabId:number):boolean {
		return this.sessionTabIds.has(tabId);
	}

	public has(sessionId:string):boolean {
		return this.activeSessions.has(sessionId);
	}
}