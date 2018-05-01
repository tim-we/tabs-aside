import { Session } from "./Session";
import { ActiveSessionList } from "./ActiveSessionList";
import { TabLoader } from "../tab-loader/TabLoader";

export class SessionManager {
	private activeSessions:ActiveSessionList = new ActiveSessionList();

	private tabLoader = new TabLoader();
}