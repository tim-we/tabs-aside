import * as ASM from "../core/ActiveSessionManager";
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
		let m:ASMMessage = <ASMMessage>msg;

		//@ts-ignore TS7017
		let result:any = ASM[m.cmd].apply(null, m.args || []);

		return (result instanceof Promise) ? result : Promise.resolve(result);
	}
});