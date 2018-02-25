class SessionLinkContextMenu extends ContextMenu {
	constructor(session, bookmark, clickX, clickY) {
		super(clickX, clickY);

		let bg = ContextMenu.bg;

		// context menu entries:

		// open copy
		let x = this.addEntry("open copy", "slcm-entry-open-copy", e => {
			browser.tabs.create({
				active: true,
				url: bookmark.url
			});
		});
		x.title = "create a new tab not linked with this session";

		// copy url
		this.addEntry("copy URL to clipboard", "slcm-entry-copy-url", e => {
			let input = document.createElement("input");
			input.type = "text";
			input.classList.add("invisible-input");
			input.value = bookmark.url;

			bg.appendChild(input);
			input.focus();
			input.select();
			document.execCommand("copy");

			input.remove();
		});

		// remove
		this.addEntry("remove from session", "slcm-entry-remove", () => {
			if (session.isActive()) {
				alert("action currently not supported");
			} else {
				browser.bookmarks.remove(bookmark.id).catch(e => {
					alert("Failed to remove bookmark.");
					console.error(e + "");
				}).then(() => {
					session.update();
				});
			}
		});
	}
}