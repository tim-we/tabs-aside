import { Session } from "./Session";
import { ActiveSessionList } from "./ActiveSessionList";
import { TabLoader } from "../tab-loader/TabLoader";

export type ASMCommand = "test";

var activeSessions:ActiveSessionList = new ActiveSessionList();

var tabLoader = new TabLoader();

export function test(x:number):String {
	return "test"+x;
}