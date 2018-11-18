export function init() {
	browser.commands.onCommand.addListener(command => {
		if (command === "tabs-aside") {
	
			//TODO
			
			//does not currently work in Firefox:
			//browser.sidebarAction.open();
		}
	});
}