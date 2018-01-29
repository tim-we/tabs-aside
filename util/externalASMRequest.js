function externalASMRequest(command, args = [], timeout = 500) {
	return new Promise((resolve, reject) => {
		let listener = function (response) {
			// expecting just 1 response:
			browser.runtime.onMessage.removeListener(listener);
			console.log(response);

			if (response.result !== undefined) {
				resolve(response.result);
			} else {
				reject(response.error ? response.error : response);
			}
		}

		browser.runtime.onMessage.addListener(listener);

		setTimeout(() => {
			if (browser.runtime.onMessage.hasListener(listener)) {
				browser.runtime.onMessage.removeListener(listener);
				reject("ASM Request Timeout");
			}
		}, timeout);

		console.log("ASM request " + command + " args: " + args.join(","));

		browser.runtime.sendMessage({
			command: "ASM",
			asmcmd: command,
			args: args
		}).catch(e => reject("[ASM] " + e));
	});
}