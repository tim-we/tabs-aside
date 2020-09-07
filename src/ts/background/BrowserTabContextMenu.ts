import * as SessionManager from "../core/SessionManager.js";
import * as ActiveSessionManager from "../core/ActiveSessionManager.js";
import * as ClassicSessionManager from "../core/ClassicSessionManager.js";
import { Tab, ContextMenuId, Bookmark, SessionId } from "../util/Types.js";
import ActiveSession from "../core/ActiveSession.js";
import TabData from "../core/TabData.js";
import { SessionContentUpdate } from "../messages/Messages.js";
import { createTab } from "../util/WebExtAPIHelpers.js";

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

    browser.menus.onShown.addListener(async (info, tab) => {
        if(info.contexts.includes("tab")) {
            shown = true;

            // get selected/highlighted tabs
            let selection = await browser.tabs.query({
                currentWindow: true,
                highlighted: true
            });

            console.assert(selection.length >= 1);

            if(selection.find(t => t.id === tab.id)) {
                createMenuForTabs(selection);
            } else {
                createMenuForTabs([tab]);
            }
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

async function createMenuForTabs(tabs:Tab[]) {
    // collect active sessions of selected tabs
    let currentSessions   = new Set<ActiveSession>();
    let currentSessionIds = new Set<SessionId>();
    tabs.forEach(tab => {
        let activeSession = ActiveSessionManager.getSessionFromTab(tab);
        if(activeSession) {
            currentSessions.add(activeSession);
            currentSessionIds.add(activeSession.bookmarkId);
        }
    });

    // get list of sessions (active + non-active)
    let sessions:Bookmark[] = await SessionManager.getSessionBookmarks();
    let activeSessions:Set<SessionId> = new Set(
        ActiveSessionManager.getActiveSessions().map(data => data.bookmarkId)
    );
    
    addToSessionMenu(sessions, currentSessionIds, activeSessions, tabs);

    if(currentSessions.size === 1) {
        dynamicMenus.push(browser.menus.create({
            parentId: "parent",
            id: "set-aside",
            title: browser.i18n.getMessage("tab_contextmenu_set_aside"),
            onclick: async (info) => {
                let currentSession:ActiveSession = currentSessions.values().next().value;

                // set aside all selected/highlighted tabs
                for(let tab of tabs) {
                    await currentSession.setTabAside(tab.id);
                }
            }
        }));
    } else if(currentSessions.size === 0) {
        addAndSetAsideMenu(sessions, activeSessions, tabs);
    }

    if(shown) {
        // rebuilding a shown menu is an expensive operation, only invoke this method when necessary
        browser.menus.refresh();
    }
}

async function addToSessionMenu(
    sessions:Bookmark[],
    currentSessionIds:Set<SessionId>,
    activeSessions:Set<SessionId>,
    tabs:Tab[]
) {
    dynamicMenus.push(
        browser.menus.create({
            parentId: "parent",
            id: "add",
            title: browser.i18n.getMessage(tabs.length > 1 ? 
                "tab_contextmenu_add_multiple" :
                "tab_contextmenu_add"
            ),
            icons: {
                "16": "img/browserMenu/add.svg",
                "32": "img/browserMenu/add.svg"
            }
        })
    );
    
    // create new session
    browser.menus.create({
        parentId: "add",
        title: "&create new session",
        icons: {
            "16": "img/browserMenu/add.svg",
            "32": "img/browserMenu/add.svg"
        },
        onclick: () => ClassicSessionManager.createSession(tabs, false)
    });

    if(sessions.length > 0) {
        browser.menus.create({
            parentId: "add",
            type: "separator"
        });
    }

    // add to existing session
    sessions.forEach(session => browser.menus.create({
        parentId: "add",
        title: "&" + session.title.replace(/&/ig, "&&").trim(),
        icons: activeSessions.has(session.id) ? {
            "16": "img/browserMenu/active.svg",
            "32": "img/browserMenu/active.svg"
        } : undefined,
        enabled: !currentSessionIds.has(session.id),
        onclick: async (info) => {
            let added = false;

            // move tabs to active session
            if(activeSessions.has(session.id)) {
                let as = ActiveSessionManager.getActiveSession(session.id);
                console.assert(as, "ActiveSession instance not found.");

                // only if the target session has its own window
                if(as.getWindowId() !== null) {
                    // move or copy tabs to new session
                    if(currentSessionIds.size === 0) {
                        for(let tab of tabs) {
                            await browser.tabs.move(tab.id, {
                                windowId: as.getWindowId(),
                                index: tab.pinned ? 0 : -1
                            });
                        }
                    } else {
                        // duplicate tabs
                        for(let tab of tabs) {
                            let details = TabData.createFromTab(tab).getTabCreateProperties(true);
                            details.windowId = as.getWindowId();
                            delete details.index;
                            await createTab(details);
                        }
                    }
                    added = true;
                }
            }
            
            // otherwise just create the bookmark
            if(!added) {
                for(let tab of tabs) {
                    let createDetails = TabData.createFromTab(tab).getBookmarkCreateDetails(session.id);
                    delete createDetails.index;
                    await browser.bookmarks.create(createDetails);
                }
            }

            // update sidebar
            SessionContentUpdate.send(session.id);
        }
    }));
}

async function addAndSetAsideMenu(
    sessions:Bookmark[],
    activeSessions:Set<SessionId>,
    tabs:Tab[]
) {
    dynamicMenus.push(
        browser.menus.create({
            parentId: "parent",
            id: "add-n-close",
            title: browser.i18n.getMessage("tab_contextmenu_add_and_set_aside"),
        })
    );

    // ignore active sessions as this operation does not make sense
    sessions = sessions.filter(session => !activeSessions.has(session.id));

    // create new session
    browser.menus.create({
        parentId: "add-n-close",
        title: browser.i18n.getMessage("tab_contextmenu_create_new"),
        icons: {
            "16": "img/browserMenu/add.svg",
            "32": "img/browserMenu/add.svg"
        },
        onclick: () => ClassicSessionManager.createSession(tabs, true)
    });

    if(sessions.length > 0) {
        browser.menus.create({
            parentId: "add-n-close",
            type: "separator"
        });
    }

    sessions.forEach(session => browser.menus.create({
        parentId: "add-n-close",
        title: "&" + session.title.replace(/&/ig, "&&").trim(),
        onclick: async (info) => {
            for(let tab of tabs) {
                const data = TabData.createFromTab(tab);
                let createDetails = data.getBookmarkCreateDetails(session.id);
                delete createDetails.index;
                await browser.bookmarks.create(createDetails);

                browser.tabs.remove(tab.id);
            }
            
            // update sidebar
            SessionContentUpdate.send(session.id);
        }
    }));
}
