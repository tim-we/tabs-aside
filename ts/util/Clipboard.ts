export function copy(text:string):void {
	// create a temporary invisible input element
	let input = document.createElement("input");
	input.type = "text";
	input.style.opacity = "0";
	input.value = text;
	document.body.appendChild(input);

	// copy
	copyTextFromInput(input);

	// remove the input element
	input.remove();
}

export function copyTextFromInput(input:HTMLInputElement):void {
	input.focus();
	input.select();
	document.execCommand("copy");
}