function externalASMRequest(command, args = [], timeout = 1000) {
	let start = Date.now();

	return new Promise((resolve, reject) => {
		let listener = function (response) {
			// expecting just 1 response:
			browser.runtime.onMessage.removeListener(listener);

			let end = Date.now();
			console.log("ASM response time: " + (end - start) + "ms");

			if (response.error !== undefined) {
				reject(response.error);
			} else {
				resolve(response.result);
			}
		}

		browser.runtime.onMessage.addListener(listener);

		if (timeout > 0) {
			setTimeout(() => {
				if (browser.runtime.onMessage.hasListener(listener)) {
					browser.runtime.onMessage.removeListener(listener);
					reject("ASM Request Timeout");
				}
			}, timeout);
		}

		browser.runtime.sendMessage({
			command: "ASM",
			asmcmd: command,
			args: args
		}).catch(e => reject("[ASM] " + e));
	});
}