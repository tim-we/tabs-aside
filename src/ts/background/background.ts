import * as SessionManager from "../core/SessionManager.js";
import { Message, SessionCommand, DataRequest } from "../messages/Messages.js";
import * as BrowserActionManager from "../browserAction/BrowserActionManager.js";
import * as KeyboardCommands from "./KeyboardCommands.js";
import * as MessageListener from "../messages/MessageListener.js";

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
