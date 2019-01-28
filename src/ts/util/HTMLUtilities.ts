let whitespaceBetweenTags:RegExp = /\>\s+\</g;

export function clean(html:string):string {
	return html.replace(whitespaceBetweenTags, "><").trim();
}

/**
 * Localizes HTML that have the `.i18n` class
 * @param container Container that will be searched for `.i18n` class members
 */
export function i18n(container:HTMLElement = document.body):void {
	container.querySelectorAll("[data-i18n]")
	.forEach((elem:HTMLElement) => {
		let messageName:string = elem.dataset.i18n;
		
		elem.textContent = browser.i18n.getMessage(messageName);
	});
}

export function DOMReady():Promise<void> {
	if(document.readyState === "loading") {
		return new Promise(resolve =>
			document.addEventListener("DOMContentLoaded", () => {resolve()})
		);
	} else {
		return Promise.resolve();
	}
}