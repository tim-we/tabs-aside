import * as ActiveSessionManager from "../core/ActiveSessionManager";
import { Message, ASMMessage } from "../core/Message";

browser.browserAction.setBadgeBackgroundColor({
	color: "#0A84FF"
});

browser.browserAction.setTitle({
	title: `Tabs Aside ${browser.runtime.getManifest().version}`
});

browser.runtime.onMessage.addListener((message:any) => {
	let msg:Message = <Message>message;

	if(msg.destination !== "background" && msg.destination !== "all") {
		return;
	}

	if(msg.type === "ASM") {
		let command:string = <"test">(<ASMMessage>msg).cmd;
		let result = ASM[command].apply(null, message.args || []);

		if (result instanceof Promise) {
			result.then(
				r => browser.runtime.sendMessage({ class: "ASMResponse", result: r }),
				e => browser.runtime.sendMessage({ class: "ASMResponse", error: e, line: e.lineNumber })
			);
		} else {
			browser.runtime.sendMessage({class:"ASMResponse",result:result});
		}
	}
});