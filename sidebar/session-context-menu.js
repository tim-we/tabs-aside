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

		if (session.isActive()) {
			// set aside
			menu.appendChild(createSCMEntry("set aside", "scm-entry-aside", () => {
				session.setAside();
				hide();
			}));
		}

		// change title
		menu.appendChild(createSCMEntry("change title", "scm-entry-rename", e => {
			let title = prompt("Enter session title:", session.title);

			if (title && title.trim()) {
				session.changeTitle(title.trim());
			}

			hide();
		}));

		// remove
		menu.appendChild(createSCMEntry("remove session", "scm-entry-remove", () => {
			if (confirm("Do you really want to delete this session from your bookmarks?")) {
				session.remove();
			}
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

	function createSCMEntry(text, id, func, tooltip=null) {
		let entry = utils.createHTMLElement("div", {}, ["scm-entry"], text);

		if (id) { entry.id = id; }
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