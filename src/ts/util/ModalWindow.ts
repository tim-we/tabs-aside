let background:HTMLDivElement = document.createElement("div");
background.id = "modal-background";

let modals:ModalWindow[] = [];

export default class ModalWindow {
	private i18n_prefix:string = "";
	private windowHTML:HTMLDivElement;
	private customContent:HTMLDivElement;
	private buttons:HTMLDivElement;
	private buttonPressed:string = null;
	private onClosed:()=>void;
	public cancelable:boolean = true;

	private constructor(i18n_prefix:string) {
		this.i18n_prefix = i18n_prefix;

		this.windowHTML = document.createElement("div");
		this.windowHTML.classList.add("modal-window");

		let content:HTMLDivElement = document.createElement("div");
		content.classList.add("content");
		this.windowHTML.appendChild(content);

		this.customContent = document.createElement("div");
		this.customContent.classList.add("custom-content");
		content.appendChild(this.customContent);

		this.buttons = document.createElement("div");
		this.buttons.classList.add("buttons");
		content.appendChild(this.buttons);
	}

	public addContent(elem:HTMLElement):void {
		this.customContent.appendChild(elem);
	}

	public addText(text:string):void {
		let p = document.createElement("p");
		p.innerText = text;
		this.addContent(p);
	}

	public show():Promise<void> {
		this.windowHTML.style.opacity = "0";
		background.appendChild(this.windowHTML);

		if(modals.length === 0) {
			background.style.opacity = "0";
			document.body.appendChild(background);
			background.style.opacity = "1";
		}

		this.computeOffset();
		this.windowHTML.style.opacity = "1";

		modals.push(this);

		return new Promise(resolve => this.onClosed = resolve);
	}

	public computeOffset():void {
		let height = window.getComputedStyle(this.windowHTML).height || "100px";
		this.windowHTML.style.marginTop = "calc(-0.5 * " + height + ")";
	}

	public close():void {
		this.windowHTML.remove();
		this.windowHTML.style.marginTop = null;

		let i = modals.indexOf(this);
		modals.splice(i, 1);

		if(modals.length === 0) {
			background.remove();
		}
		
		this.onClosed();
	}

	public setButtons(buttonIds:string[]):void {
		this.buttons.innerHTML = "";
		buttonIds.forEach(buttonId => {
			let modal = this;
			let button:HTMLButtonElement = document.createElement("button");
			button.innerText = browser.i18n.getMessage(this.i18n_prefix + buttonId) || buttonId;
			button.classList.add("browser-style");
			this.buttons.appendChild(button);

			button.addEventListener("click", e => {
				e.stopPropagation();
				modal.buttonPressed = buttonId;
				modal.close();
			});
		});
	}

	public static alert(text:string):Promise<void> {
		let modal = new ModalWindow("modal_alert_");
		modal.addText(text);
		modal.setButtons(["ok"]);

		return modal.show();
	}

	public static async confirm(text:string):Promise<boolean> {
		let modal = new ModalWindow("modal_confirm_");
		modal.addText(text);
		modal.setButtons(["ok", "cancel"]);
		modal.cancelable = false;

		await modal.show();

		return modal.buttonPressed === "ok";
	}
}

background.addEventListener("click", () => {
	let currentModal = modals[modals.length - 1];
	
	if(currentModal.cancelable) {
		currentModal.close();
	}
});

window.addEventListener("resize", () => {
	modals.forEach(modal => {
		modal.computeOffset();
	});
});