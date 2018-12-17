(function(){
	let _alert   = window.alert,
		_confirm = window.confirm,
		_prompt  = window.prompt;
	
	let bg = null;
	
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
	
	// apply fix
	window.alert = text => {
		addBackgroundElement();
		_alert(text);
		removeBackgroundElement();
	};
	
	window.confirm = text => {
		addBackgroundElement();
		let res = _confirm(text);
		removeBackgroundElement();
		return res;
	};
	
	window.prompt = (text, _default) => {
		addBackgroundElement();
		let res = _prompt(text, _default);
		removeBackgroundElement();
		return res;
	};
})();