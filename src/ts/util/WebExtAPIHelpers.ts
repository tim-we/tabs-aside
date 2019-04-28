export async function getCurrentWindowId():Promise<number> {
	let wnd = await browser.windows.getLastFocused({populate: false});

	return wnd ? wnd.id : browser.windows.WINDOW_ID_NONE;
}

export async function getCommandByName(name:string):Promise<browser.commands.Command> {
	let commands = await browser.commands.getAll();
	return commands.find(c => c.name === name);
}