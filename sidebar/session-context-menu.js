var SCM = (function () {
	let bg = null;

	function show(session, clickX, clickY) {
		if (bg) { hide(); }

		// create menu:
		let menu = utils.createHTMLElement("div", { id: "scm" }, []);
		menu.addEventListener("click", e => e.stopPropagation());
		menu.style.top = clickY + "px";
		menu.style.right = (window.innerWidth - clickX) + "px";
		
		// context menu entries:

		// change title
		menu.appendChild(createSCMEntry("change title", null, e => {
			e.stopPropagation();

			let title = prompt("Enter session title:", session.title);

			if (title && title.trim()) {
				session.changeTitle(title.trim());
			}

			hide();
		}));

		// remove
		menu.appendChild(createSCMEntry("remove session", null, () => {
			//session.remove();
			hide();
		}));

		// show menu:
		bg = utils.createHTMLElement("div", { id: "scm-bg" }, []);
		bg.addEventListener("click", e => {
			e.stopPropagation();
			hide();
		});
		bg.appendChild(menu);
		document.body.appendChild(bg);

		window.addEventListener("blur", blurEventListener);
	}

	function createSCMEntry(text, tooltip, func) {
		let entry = utils.createHTMLElement("div", {}, ["scm-entry"], text);

		if (tooltip) { entry.title = tooltip; }

		if (func) { entry.addEventListener("click", func); }

		return entry;
	}

	function hide() {
		if (bg) {
			bg.remove();
			bg = null;
		}

		window.removeEventListener("blur", blurEventListener);
	}

	function blurEventListener() {
		hide();
	}

	return {
		show: show,
		hide: hide
	};
})();