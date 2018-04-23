function externalASMRequest(command, args = [], timeout = 0) {
	let start = Date.now();

	return new Promise((resolve, reject) => {
		let listener = function (response) {
			if(!response || response.class !== "ASMResponse") { return; }

			// expecting just 1 response:
			browser.runtime.onMessage.removeListener(listener);

			// compute response time
			let end = Date.now();
			let rt = end - start;
			if (rt > 250) {
				console.log("ASM response time: " + rt + "ms");
			}

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
		}).catch(e => {
			let msg = "[ASM] " + e;

			if (e.lineNumber) {
				msg += " on line " + e.lineNumber;
			}

			reject(msg);
		});
	});
}