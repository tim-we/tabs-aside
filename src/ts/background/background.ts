import * as SessionManager from "../core/SessionManager.js";
import { Message, SessionCommand, DataRequest, BackgroundPing, ExtensionCommand } from "../messages/Messages.js";
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
				} else if(message.type === "Ping") {
					return Promise.resolve(BackgroundPing.RESPONSE);
				}
			});
		});

		// if sidebar was already open it has to be reloaded
		// because the background page was unable to send any data
		if(await browser.sidebarAction.isOpen({})) {
			let m = new ExtensionCommand("sidebar", "reload");
			browser.runtime.sendMessage(m).catch(e => {
				console.error("[TA] Failed to send reload command to sidebar.", e);
			});
		}

		BrowserTabContextMenu.init();
	} else {
		setup();
	}
})();

