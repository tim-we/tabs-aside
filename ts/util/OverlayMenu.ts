let background:HTMLElement = document.createElement("div");
background.id = "overlay-menu-bg";

let isActive:boolean = false;

export default abstract class OverlayMenu {
	private htmlMenu:HTMLElement;

	constructor() {
		this.htmlMenu = document.createElement("div");
		this.htmlMenu.classList.add("overlay-menu");
	}

	public showOn(element:HTMLElement) {
		let box = element.getBoundingClientRect();
		
		let posX = box.left + box.width;
		let posY = box.top + box.height;

		this.showAt(posX, posY);
	}

	public showAt(posX:number, posY:number) {
		// compute & set menu position
		let x = Math.max(0, window.innerWidth - Math.max(150, posX));
		let y = posY;

		if(posX < 160 && posX < x) {
			x = Math.max(0, posX);
			this.htmlMenu.style.left = x + "px";
			this.htmlMenu.classList.add("origin-left");
		} else {
			this.htmlMenu.style.right = x + "px";
		}

		this.htmlMenu.style.top = y + "px";
		
		// add to background element
		background.appendChild(this.htmlMenu);
		
		// show
		showBG();
	}

	public hide() {
		hideBG();
	}

	protected addItem(i18n:string, onclick:(e:MouseEvent) => void, id?:string) {
		let item = document.createElement("div");
		item.classList.add("overlay-menu-item");
		item.textContent = browser.i18n.getMessage(i18n);

		if(id) {
			item.id = id;
		}
		
		item.addEventListener("click", onclick);

		this.htmlMenu.appendChild(item);
	}
}

function showBG() {
	document.body.appendChild(background);

	isActive = true;
}

function clearBG() {
	while(background.firstChild) {
		background.removeChild(background.firstChild);
	}
}

function hideBG() {
	clearBG();

	isActive = false;
	background.remove();
}

// event listeners
window.addEventListener("keydown", e => {
	if(isActive) {
		e.stopPropagation();
		e.stopImmediatePropagation();
		hideBG();
	}
});

background.addEventListener("click", e => {
	e.stopPropagation();
	hideBG();
});

background.addEventListener("contextmenu", e => {
	e.stopPropagation();
	e.preventDefault();
});