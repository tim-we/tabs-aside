export abstract class TabsAsideError {
	protected message:string;

	constructor(i18n:string) {
		this.message = browser.i18n.getMessage(i18n);
	}

	createHTML(): HTMLElement {
		let error:HTMLDivElement = document.createElement("div");
		error.classList.add("error");

		let text:HTMLSpanElement = document.createElement("span");
		text.textContent = this.message;
		error.appendChild(text);

		return error;
	}
}

export class CriticalError extends TabsAsideError {
	createHTML():HTMLElement {
		let error = super.createHTML();
		error.classList.add("critical-error");
		return error;
	}
}

export class SolvableError extends TabsAsideError {
	private i18n:string;
	private solution:Solution = null;

	constructor(i18n:string) {
		super(i18n);
		this.i18n = i18n;
	}

	public setSolution(solveAction:ErrorSolver):void {
		this.solution = new Solution(
			browser.i18n.getMessage(this.i18n + "_solution"),
			solveAction
		);
	}

	public createHTML():HTMLElement {
		let error:HTMLElement = super.createHTML();

		if(this.solution) {
			let fix:HTMLButtonElement = document.createElement("button");
			fix.dataset.i18n = this.i18n;
			fix.textContent = this.solution.text;
			fix.addEventListener("click", () => this.solution.solveAction());
			error.appendChild(fix);
		}

		return error;
	}
}

type ErrorSolver = () => any;

class Solution {
	public text:string;
	public solveAction:ErrorSolver;

	constructor(text:string, solveAction:ErrorSolver) {
		this.text = text;
		this.solveAction = solveAction;
	}
}