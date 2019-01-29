import * as SessionManager from "../core/SessionManager.js";
import * as ActiveSessionManager from "../core/ActiveSessionManager.js";
import { Tab, ContextMenuId, Bookmark, SessionId } from "../util/Types.js";

let shown:boolean = false;
let dynamicMenus:ContextMenuId[] = [];

const parentOptions = {
	id: "parent",
	contexts: ["tab"] as "tab"[],
	icons: {
		"16": "img/browserAction/dark.svg",
		"32": "img/browserAction/dark.svg",
	},
	title: browser.i18n.getMessage("tab_contextmenu_title")
};

export async function init() {
	browser.menus.create(parentOptions);

	browser.menus.onShown.addListener((info, tab) => {
		if(info.contexts.includes("tab")) {
			shown = true;
			createMenuForTab(tab);
		}
	});

	browser.menus.onHidden.addListener(() => {
		if(shown) {
			shown = false;

			// remove all dynamically added menus
			dynamicMenus.forEach(menuId => browser.menus.remove(menuId));
		}
	});
}

async function createMenuForTab(tab:Tab) {
	let currentSession:SessionId = ActiveSessionManager.getSessionFromTab(tab);
	let sessions:Bookmark[] = await SessionManager.getSessionBookmarks();
	let activeSessions:Set<SessionId> = new Set(
		ActiveSessionManager.getActiveSessions().map(data => data.bookmarkId)
	);

	addToSessionMenu(sessions, currentSession, activeSessions, tab);
	browser.menus.refresh();
}

async function addToSessionMenu(
	sessions:Bookmark[],
	currentSession:SessionId,
	activeSessions:Set<SessionId>,
	tab:Tab
) {
	sessions = sessions.filter(session => session.id !== currentSession);

	if(sessions.length > 0) {
		dynamicMenus.push(
			browser.menus.create({
				parentId: "parent",
				id: "add",
				title: browser.i18n.getMessage("tab_contextmenu_add")
			})
		);

		sessions.forEach(session => browser.menus.create({
			parentId: "add",
			title: session.title,
			icons: activeSessions.has(session.id) ? {
				"16": "img/browserMenu/active.svg",
				"32": "img/browserMenu/active.svg"
			} : undefined
		}));
	}
}