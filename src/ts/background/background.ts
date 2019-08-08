import * as SessionManager from "../core/SessionManager.js";
import { Message, SessionCommand, DataRequest } from "../messages/Messages.js";
import * as BrowserActionManager from "../browserAction/BrowserActionManager.js";
import * as KeyboardCommands from "./KeyboardCommands.js";
import * as MessageListener from "../messages/MessageListener.js";
import * as BrowserTabContextMenu from "./BrowserTabContextMenu.js";
import { isSetup, setup } from "./Setup.js";

MessageListener.setDestination("background");

(async function(){
	if(await isSetup()) {
		BrowserActionManager.init();
		KeyboardCommands.init();

		SessionManager.init().then(() => {
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
		});


		BrowserTabContextMenu.init();
	} else {
		setup();
	}
})();

