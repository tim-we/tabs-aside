import * as HTMLUtils from "../../util/HTMLUtilities.js";

type CompletionListener = () => any;

export default class SetupStep {
	private static parent:HTMLElement;
	private static current:SetupStep = null;
	private readonly html:HTMLElement;
	private options:HTMLElement = null;
	private completionListeners:Set<CompletionListener> = new Set();

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

	public addOption(i18n:string, action:()=>Promise<void>, recommended:boolean = false):void {
		if(!this.options) {
			this.options = document.createElement("div");
			this.options.classList.add("options");
			this.html.appendChild(this.options);
		}

		let a:HTMLAnchorElement = document.createElement("a");
		a.innerText = browser.i18n.getMessage(i18n) || i18n;
		a.addEventListener("click", async () => {
			action().then(
				() => this.complete(),
				() => {}
			);
		});

		if(recommended) {
			a.classList.add("recommended");
		}

		this.options.appendChild(a);
	}

	public completion():Promise<void> {
		return new Promise(resolve => {
			this.completionListeners.add(resolve);
		});
	}

	private complete() {
		this.completionListeners.forEach(f => f());
		this.completionListeners.clear();
	}
}
