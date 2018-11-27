import * as HTMLUtils from "../util/HTMLUtilities.js";
import * as Clipboard from "../util/Clipboard.js";

const prefix:string = browser.runtime.getURL("html/privileged.html");

(async function() {
	await HTMLUtils.DOMReady();

	// apply localization
	HTMLUtils.i18n();

	let urlInput:HTMLInputElement = <HTMLInputElement>document.getElementById("url");

	// expected URL parameters: url [, title]
	let params:URLSearchParams = new URL(window.location.href).searchParams;
	let url = params.get("url");

	// avoid linking to this page
	if(url.startsWith(prefix)) {
		params = new URL(url).searchParams;

		if(params.has("url")) {
			setTimeout(() => {
				window.location.href = url;
			}, 250);
		}
	}

	urlInput.value = url;
	urlInput.focus();
	urlInput.select();

	// title
	if(params.has("title")) {
		document.title = params.get("title");
	}

	// copy button
	let copyButton:HTMLElement = document.getElementById("copy");
	copyButton.onclick = () => {
		Clipboard.copyTextFromInput(urlInput);
	};

})();
