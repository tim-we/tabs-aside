let _alert = window.alert;
let _confirm = window.confirm;
let _prompt = window.prompt;

let bg:HTMLDivElement;

function addBackgroundElement() {
	bg = document.createElement("div");
	bg.style.position = "fixed";
	bg.style.top = "0px";
	bg.style.bottom = "0px";
	bg.style.left = "0px";
	bg.style.right = "0px";
	bg.style.backgroundColor = "white";
	bg.style.zIndex = "9999";

	document.body.appendChild(bg);
}

function removeBackgroundElement() {
	document.body.removeChild(bg);
}

export function apply() {
	window.alert = (text:string) => {
		addBackgroundElement();
		_alert(text);
		removeBackgroundElement();
	}

	window.confirm = (text:string) => {
		addBackgroundElement();
		let res = _confirm(text);
		removeBackgroundElement();
		return res;
	}

	window.prompt = (text:string, _default?:string) => {
		addBackgroundElement();
		let res = _prompt(text, _default);
		removeBackgroundElement();
		return res;
	}
}

