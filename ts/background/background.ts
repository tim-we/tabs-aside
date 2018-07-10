import * as ASM from "../core/SessionManager";
import { Message, ASMMessage } from "../core/Messages";
import * as BrowserActionManager from "../browserAction/BrowserActionManager";
import * as CommandHandler from "./CommandHandler";

BrowserActionManager.init();

CommandHandler.init();

browser.runtime.onMessage.addListener((message:Message) => {

	if(message.destination !== "background" && message.destination !== "all") {
		return;
	}

	if(message.type === "ASM") {
		let m:ASMMessage = <ASMMessage>message;

		//@ts-ignore TS7017
		let result:any = ASM[m.cmd].apply(null, m.args || []);

		return (result instanceof Promise) ? result : Promise.resolve(result);
	}
});