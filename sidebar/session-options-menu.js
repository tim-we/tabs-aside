class SessionOptionsMenu extends ContextMenu {
	constructor(session, clickX, clickY) {
		super(clickX, clickY);

		// context menu entries:

		if (session.isActive()) {
			// set aside
			this.addEntry("set aside", "scm-entry-aside", () => {
				session.setAside();
			});
		} else {
			// open in new window
			this.addEntry("open in new window", "scm-entry-newwindow", () => {
				session.restore(true);
			});
		}

		// change title
		this.addEntry("change title", "scm-entry-rename", e => {
			session.rename();
		});

		// remove
		this.addEntry("remove session", "scm-entry-remove", () => {
			let msg = "Do you really want to delete this session?\n";

			if (session.isActive()) {
				msg += "All tabs from this session will be closed.";
			}

			if (confirm(msg)) {
				session.remove();
			}
		});
	}
}