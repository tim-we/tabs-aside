import { Tab, TabCreateProperties } from "./Types";

export async function getCurrentWindowId():Promise<number> {
	let wnd = await browser.windows.getLastFocused({populate: false});

	return wnd ? wnd.id : browser.windows.WINDOW_ID_NONE;
}

export async function getCommandByName(name:string):Promise<browser.commands.Command> {
	let commands = await browser.commands.getAll();
	return commands.find(c => c.name === name);
}

const tabErrorUrl = browser.runtime.getURL("html/tab-error.html");

export function createTab(createProperties:TabCreateProperties):Promise<Tab> {
	return browser.tabs.create(createProperties).then(tab => tab, error => {
		console.error("[TA] Failed to create tab: " + error, error);

		// create a tab that displays the error
		let params = new URLSearchParams();
		params.append("url", createProperties.url);
		params.append("details", error+"");

		if(error instanceof Error && error.message) {
			if(error.message.includes("cookie store") || error.message.includes("Contextual identities")) {
				params.append("error", "container");
			}
		}

		return browser.tabs.create({
			active: createProperties.active,
			pinned: createProperties.pinned,
			windowId: createProperties.windowId,
			url: tabErrorUrl + "?" + params
		});
	});
}
