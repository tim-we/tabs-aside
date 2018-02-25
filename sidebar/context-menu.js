class ContextMenu {
	constructor(posX, posY) {
		// if there is a context menu -> close it
		ContextMenu.close();

		ContextMenu.currentMenu = this;

		// create menu:
		let menu = this.menu = utils.createHTMLElement("div", { id: "cm" }, []);
		menu.addEventListener("click", e => e.stopPropagation());

		// compute menu position
		let x = Math.max(0, window.innerWidth - Math.max(150, posX) - 1);
		let y = posY - 1;

		// set position (css properties right & top)
		menu.style.right = x + "px";
		menu.style.top = y + "px";

		if (posX < 160 && posX < x) {
			menu.classList.add("align-left");
			x = Math.max(0, posX - 1);
			menu.style.right = "auto";
			menu.style.left = x + "px";
		}
		
		// create background element (click catcher)
		let bg = ContextMenu.bg = utils.createHTMLElement("div", { id: "cm-bg" }, []);
		bg.addEventListener("click", e => {
			e.stopPropagation();
			ContextMenu.close();
		});

		bg.addEventListener("contextmenu", e => {
			e.stopPropagation();
			e.preventDefault();
			ContextMenu.close();
		});

		// show menu
		bg.appendChild(menu);
		document.body.appendChild(bg);
	}

	addEntry(text, id, func, tooltip=null) {
		let entry = utils.createHTMLElement("div", {}, ["cm-entry"], text);

		if (id) { entry.id = id; }
		if (tooltip) { entry.title = tooltip; }
		if (func) { entry.addEventListener("click", func); }

		entry.addEventListener("click", e => {
			ContextMenu.close();
		});

		this.menu.appendChild(entry);

		return entry;
	}

	static close() {
		if (ContextMenu.currentMenu) {
			ContextMenu.currentMenu = null;
			let bg = ContextMenu.bg;
			ContextMenu.bg = null;
			bg.remove();
		}
	}

	static blur() {
		ContextMenu.close();
	}
}

ContextMenu.bg = null;
ContextMenu.currentMenu = null;

window.addEventListener("blur", ContextMenu.blur);