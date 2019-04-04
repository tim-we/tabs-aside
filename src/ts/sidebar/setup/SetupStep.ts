import * as HTMLUtils from "../../util/HTMLUtilities.js";

export default class SetupStep {
	private static parent:HTMLElement;
	private static current:SetupStep = null;
	private readonly html:HTMLElement;
	private options:HTMLElement = null;

	public constructor(messageName:string) {
		this.html = document.createElement("div");
		this.html.classList.add("content-box");

		let text = browser.i18n.getMessage(messageName);
		let ps = HTMLUtils.stringToParagraphs(text);
		ps.forEach(p => this.html.appendChild(p));
	}

	public static setParent(parent:HTMLElement):void {
		SetupStep.parent = parent;
	}

	public show():void {
		SetupStep.parent.appendChild(this.html);
		if(SetupStep.current) {
			SetupStep.current.html.remove();
		}
		SetupStep.current = this;
	}

	public addOption(i18n:string, action:()=>any, recommended:boolean = false):void {
		if(!this.options) {
			this.options = document.createElement("div");
			this.options.classList.add("options");
			this.html.appendChild(this.options);
		}

		let a:HTMLAnchorElement = document.createElement("a");
		a.innerText = browser.i18n.getMessage(i18n) || i18n;
		a.addEventListener("click", action);

		if(recommended) {
			a.classList.add("recommended");
		}

		this.options.appendChild(a);
	}
}
