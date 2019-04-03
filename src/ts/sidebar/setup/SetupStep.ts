import * as HTMLUtils from "../../util/HTMLUtilities.js";

export default class SetupStep {
	private static parent:HTMLElement;
	private static current:SetupStep = null;
	private readonly html:HTMLDivElement;

	public constructor(messageName:string) {
		this.html = document.createElement("div");
		this.html.classList.add("setup-step");

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
}
