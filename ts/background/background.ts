import * as SessionManager from "../core/SessionManager";
import { Message, SessionCommand } from "../core/Messages";
import * as BrowserActionManager from "../browserAction/BrowserActionManager";
import * as KeyboardCommands from "./KeyboardCommands";
import * as UnloadedTabs from "../core/UnloadedTabs";

BrowserActionManager.init();
UnloadedTabs.init();
KeyboardCommands.init();

browser.runtime.onMessage.addListener(async (message:Message) => {

	if(message.destination !== "background" && message.destination !== "all") {
		return;
	}

	if(message.type === "SessionCommand") {
		let cmd:SessionCommand = message as SessionCommand;

		return await SessionManager.execCommand(cmd);
	}
});