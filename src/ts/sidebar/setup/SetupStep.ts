import * as HTMLUtils from "../../util/HTMLUtilities.js";

type CompletionListener = () => any;

type OptionDetails = {
	text: string;
	action: ()=>Promise<void>;
	recommended?:boolean;
	detailList?:string[]
};

export default class SetupStep {
	private static parent:HTMLElement;
	private static current:SetupStep = null;
	private readonly html:HTMLElement;
	private options:HTMLElement = null;
	private completionListeners:Set<CompletionListener> = new Set();
	private recommended:HTMLAnchorElement = null;

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

	public addOption(details:OptionDetails):void {
		if(!this.options) {
			this.options = document.createElement("div");
			this.options.classList.add("options");
			this.html.appendChild(this.options);
		}

		let prepend:boolean = false;

		let a:HTMLAnchorElement = document.createElement("a");
		a.innerText = browser.i18n.getMessage(details.text) || details.text;
		a.addEventListener("click", async () => {
			details.action().then(
				() => this.complete(),
				() => {}
			);
		});

		if(details.recommended) {
			// there can only be one recommended option
			if(this.recommended) {
				this.recommended.classList.remove("recommended");
				this.recommended.removeAttribute("title");
				prepend = true;
			}

			a.classList.add("recommended");
			a.title = browser.i18n.getMessage("setup_recommended_option");
			this.recommended = a;
		}

		if(details.detailList) {
			let ul = document.createElement("ul");

			details.detailList.forEach(
				msg => {
					let text = browser.i18n.getMessage(msg);

					if(text) {
						let li = document.createElement("li");
						li.innerText = text;
						ul.appendChild(li);
					}
				}
			);

			a.appendChild(ul);
		}

		if(prepend) {
			this.options.prepend(a);
		} else {
			this.options.appendChild(a);
		}
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
