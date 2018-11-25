import * as SessionManager from "../core/SessionManager";
import { Message, SessionCommand, DataRequest } from "../messages/Messages";
import * as BrowserActionManager from "../browserAction/BrowserActionManager";
import * as KeyboardCommands from "./KeyboardCommands";
import * as MessageListener from "../messages/MessageListener";

MessageListener.setDestination("background");
BrowserActionManager.init();
KeyboardCommands.init();

MessageListener.add("*", async (message:Message) => {
	if(message.type === "SessionCommand") {
		let cmd:SessionCommand = message as SessionCommand;

		return await SessionManager.execCommand(cmd);
	}
});

browser.runtime.onMessage.addListener((message:Message) => {
	if(message.type === "DataRequest") {
		let req:DataRequest = message as DataRequest;

		return SessionManager.dataRequest(req);
	}
});
