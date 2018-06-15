import { Session } from "./Session";
import { ActiveSessionList } from "./ActiveSessionList";
import { TabLoader } from "../tab-loader/TabLoader";

var activeSessions:ActiveSessionList = new ActiveSessionList();

var tabLoader = new TabLoader();

export function _do(command:string, data?:any) {

}