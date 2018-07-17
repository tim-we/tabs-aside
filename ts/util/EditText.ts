import { resolve } from "path";

let previousText:Map<HTMLElement, string> = new Map();
let rejectors:Map<HTMLElement, () => void> = new Map();

export function edit(element:HTMLElement, placeholder:string = "", minLength:number = 1):Promise<string> {
	if(previousText.has(element)) {
		return Promise.reject("Element is already in edit mode.");
	}

	// store current text content
	previousText.set(element, element.textContent);

	// create input element
	let input:HTMLInputElement = document.createElement("input");
	input.type = "text";
	input.placeholder = placeholder;
	input.value = element.textContent;
	input.title = "";
	input.style.width = (element.offsetWidth + 2) + "px";
	// catch clicks
	input.addEventListener("click", e => e.stopPropagation());

	// replace text with input element
	element.textContent = "";
	element.appendChild(input);
	element.classList.add("editmode");
	input.focus();

	// a promise that resolves when user input is "completed"
	let editComplete:Promise<any> = new Promise((resolve,reject) => {
		rejectors.set(element, reject);

		// set up user input events
		input.addEventListener("blur", () => resolve());

		input.addEventListener("keydown", e => {
			e.stopPropagation();
	
			if (e.keyCode === 13) { // ENTER
				resolve();
			} else if (e.keyCode === 27) { // ESC
				reject();
			}
		});

		input.select();
	}).catch(() => {
		closeEditMode(element, previousText.get(element));

		return Promise.reject();
	});

	return editComplete.then(() => {
		let text:string = input.value.trim();

		if(text.length >= minLength) {
			closeEditMode(element, text);
			return Promise.resolve(text);
		} else {
			closeEditMode(element, previousText.get(element));
			return Promise.reject();
		}
	});
}

function closeEditMode(element:HTMLElement, text:string) {
	// remove input & show text
	element.innerHTML = "";
	element.classList.remove("editmode");
	element.textContent = text;

	// clean up bookkeeping
	previousText.delete(element);
	rejectors.delete(element);
}

export function cancel(element:HTMLElement):void {
	let reject = rejectors.get(element);

	if(reject) {
		reject();
	}
}

export function cancelAll():void {
	Array.from(rejectors.values()).forEach(reject => reject());
}