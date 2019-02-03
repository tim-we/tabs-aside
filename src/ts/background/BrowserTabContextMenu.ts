import * as SessionManager from "../core/SessionManager.js";
import * as ActiveSessionManager from "../core/ActiveSessionManager.js";
import { Tab, ContextMenuId, Bookmark, SessionId } from "../util/Types.js";
import ActiveSession from "../core/ActiveSession.js";
import TabData from "../core/TabData.js";
import { SessionContentUpdate } from "../messages/Messages.js";

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
	let currentSession:ActiveSession = ActiveSessionManager.getSessionFromTab(tab);
	let currentSessionId:SessionId = currentSession ? currentSession.bookmarkId : null;
	let sessions:Bookmark[] = await SessionManager.getSessionBookmarks();
	let activeSessions:Set<SessionId> = new Set(
		ActiveSessionManager.getActiveSessions().map(data => data.bookmarkId)
	);

	addToSessionMenu(sessions, currentSessionId, activeSessions, tab);

	if(currentSession) {
		dynamicMenus.push(browser.menus.create({
			parentId: "parent",
			id: "set-aside",
			title: browser.i18n.getMessage("tab_contextmenu_set_aside"),
			onclick: info => {
				currentSession.setTabAside(tab.id);
			}
		}));
	} else {
		addAndSetAsideMenu(sessions, activeSessions, tab);
	}

	browser.menus.refresh();
}

async function addToSessionMenu(
	sessions:Bookmark[],
	currentSessionId:SessionId,
	activeSessions:Set<SessionId>,
	tab:Tab
) {
	if(sessions.length > 0) {
		dynamicMenus.push(
			browser.menus.create({
				parentId: "parent",
				id: "add",
				title: browser.i18n.getMessage("tab_contextmenu_add"),
				icons: {
					"16": "img/browserMenu/add.svg",
					"32": "img/browserMenu/add.svg"
				}
			})
		);

		sessions.forEach(session => browser.menus.create({
			parentId: "add",
			title: "&" + session.title.replace(/&/ig, "&&").trim(),
			icons: activeSessions.has(session.id) ? {
				"16": "img/browserMenu/active.svg",
				"32": "img/browserMenu/active.svg"
			} : undefined,
			enabled: session.id !== currentSessionId,
			onclick: async (info) => {
				let data = TabData.createFromTab(tab);
				await browser.bookmarks.create(
					data.getBookmarkCreateDetails(session.id)
				);

				// update sidebar
				SessionContentUpdate.send(session.id);
			}
		}));
	}
}

async function addAndSetAsideMenu(
	sessions:Bookmark[],
	activeSessions:Set<SessionId>,
	tab:Tab
) {
	if(sessions.length > 0) {
		dynamicMenus.push(
			browser.menus.create({
				parentId: "parent",
				id: "add-n-close",
				title: browser.i18n.getMessage("tab_contextmenu_add_and_set_aside"),
			})
		);

		sessions.forEach(session => browser.menus.create({
			parentId: "add-n-close",
			title: "&" + session.title.replace(/&/ig, "&&").trim(),
			icons: activeSessions.has(session.id) ? {
				"16": "img/browserMenu/active.svg",
				"32": "img/browserMenu/active.svg"
			} : undefined,
			onclick: async (info) => {
				let data = TabData.createFromTab(tab);
				await browser.bookmarks.create(
					data.getBookmarkCreateDetails(session.id)
				);

				browser.tabs.remove(tab.id);

				// update sidebar
				SessionContentUpdate.send(session.id);
			}
		}));
	}
}