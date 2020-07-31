import ActiveSession, { ActiveSessionData } from "./ActiveSession.js";
import TabData from "./TabData.js";
import {
    SessionCommand,
    DataRequest,
    CreateSessionArguments as CSA,
    ModifySessionArguments as MSA,
    ModifySessionMetaArguments as MSMA,
    SessionCMD as CmdId,
    SessionEvent,
    StateInfoData
} from "../messages/Messages.js";
import * as OptionsManager from "../options/OptionsManager.js";
import { Bookmark, SessionId, Tab } from "../util/Types.js";

import * as  ActiveSessionManager from  "./ActiveSessionManager.js";
import * as ClassicSessionManager from "./ClassicSessionManager.js";
import { getCurrentWindowId, createTab, getAnotherWindow } from "../util/WebExtAPIHelpers.js";
import * as WindowFocusHistory from "../background/WindowFocusHistory.js";
import { limit } from "../util/StringUtils.js";
import { generateSessionTitle } from "./SessionTitleGenerator.js";

type CmdCallback = (data:MSA|CSA|MSMA) => void;

const commands:Map<CmdId, CmdCallback> = new Map();

commands.set("restore",        (data:MSA) => restore(data.sessionId, data.keepBookmarks || false));
commands.set("restore-single", (data:MSA) => restoreSingle(data.tabBookmarkId));

commands.set("set-aside", async (data:MSA) => {
    await ActiveSessionManager.setAside(data.sessionId);
    updateBrowserActionContextMenu();
});

commands.set("create", (data:CSA) =>
    createSessionFromWindow(
        data.setAside,
        data.windowId,
        data.title
    )
);

commands.set("remove",     (data:MSA) => removeSession(data.sessionId, data.keepTabs || false));
commands.set("remove-tab", (data:MSA) => removeTabFromSession(data.tabBookmarkId));

commands.set("rename",     (data:MSMA) => renameSession(data.sessionId, data.title));

export async function init() {
    WindowFocusHistory.init();
    await ActiveSessionManager.findActiveSessions();
    updateBrowserActionContextMenu();
}

export async function execCommand(sc:SessionCommand):Promise<any> {
    let callback = commands.get(sc.cmd);

    if(callback) {
        callback(sc.argData);
    } else {
        console.error("[TA] No such command: " + sc.cmd);
    }
}

export async function dataRequest(req:DataRequest):Promise<any> {
    if(req.data === "active-sessions") {
        return ActiveSessionManager.getActiveSessions();
    } else if(req.data === "state-info") {
        let sessions:ActiveSessionData[] = ActiveSessionManager.getActiveSessions();
        let tabs:Tab[] = await browser.tabs.query({
            currentWindow: true
        });

        let availableTabs:Tab[] = tabs.filter(tab => {
            // exclude tabs that are part of an active session
            for(let i=0; i<sessions.length; i++) {
                if(sessions[i].tabs.includes(tab.id)) {
                    return false;
                }
            }

            // exclude privileged tabs
            return !TabData.createFromTab(tab).isPrivileged();
        });

        let currentWindowId:number = await getCurrentWindowId();
        let currentTab:Tab = tabs.find(tab => tab.active);

        let stateInfo:StateInfoData = {
            availableTabs: availableTabs.length,
            sessions: sessions,
            currentSession: sessions.find(
                session => session.tabs.includes(currentTab.id)
            ),
            currentWindowSessions: sessions.filter(
                session => session.windowId === currentWindowId
            ),
            previousWindowId: WindowFocusHistory.getPreviousWindow()
        }

        return stateInfo;
    } else {
        return Promise.reject("No handler for " + req.data);
    }
}

export async function restore(sessionId:SessionId, keepBookmarks:boolean):Promise<void> {
    let activeSessionsEnabled:boolean = await OptionsManager.getValue("activeSessions");

    // delegate
    if(activeSessionsEnabled) {
        await ActiveSessionManager.restore(sessionId);
    } else {
        await ClassicSessionManager.restore(sessionId, keepBookmarks);
    }

    updateBrowserActionContextMenu();
}

export async function restoreSingle(tabBookmarkId:string) {
    let tabBookmark:Bookmark = (await browser.bookmarks.get(tabBookmarkId))[0];
    let sessionId:SessionId = tabBookmark.parentId;
    let session:ActiveSession = ActiveSessionManager.getActiveSession(sessionId);

    if(session) {
        // if session is already partially active add tab to active session
        session.openBookmarkTab(tabBookmark, true);
    } else {
        // create a new tab (no active session) otherwise
        let data:TabData = TabData.createFromBookmark(tabBookmark);
        createTab(data.getTabCreateProperties(true));
    }

    updateBrowserActionContextMenu();
}

export async function createSessionFromTabs(
    tabs:browser.tabs.Tab[],
    setAside:boolean,
    title?:string
):Promise<SessionId> {
    if(title === undefined) {
        title = await generateSessionTitle();
    }

    const n = tabs.length;

    // load settings
    const activeSessionsEnabled:boolean = await OptionsManager.getValue("activeSessions");
    const asidePinnedTabs:boolean       = await OptionsManager.getValue("asidePinnedTabs");

    // filter tabs that cannot be restored
    tabs = tabs.filter(tab => !TabData.createFromTab(tab).isPrivileged());

    if(!asidePinnedTabs) {
        tabs = tabs.filter(tab => !tab.pinned);
    }

    // build set of active tabs
    let activeTabs:Set<number> = new Set();
    ActiveSessionManager.getActiveSessions().forEach(
        session => session.tabs.forEach(
            tab => activeTabs.add(tab)
        )
    );
    
    // ignore tabs that are part of an active session
    tabs = tabs.filter(tab => !activeTabs.has(tab.id));

    // sort tabs by tab index to prevent insertion order problems
    tabs = tabs.sort((a,b) => a.index - b.index);

    let sessionId:string;

    // create session
    if(activeSessionsEnabled) {
        // not all tabs of the current window will be part of the session
        // -> create a new window [session tabs will be moved to that window]
        const session = await ActiveSessionManager.createSessionFromTabs({
            tabs: tabs,
            title: title,
            windowId: (tabs.length < n) ? undefined : tabs[0].windowId,
            newWindow: tabs.length < n
        });

        sessionId = session.bookmarkId;

        if(setAside) {
            ActiveSessionManager.setAside(sessionId);
        }
    } else {
        sessionId = await ClassicSessionManager.createSession(tabs, setAside, title);
    }

    updateBrowserActionContextMenu();

    return sessionId;
}

export async function createSessionFromWindow(
    setAside:boolean,
    windowId?:number,
    title?:string
):Promise<SessionId> {
    if(windowId === undefined) {
        windowId = await getCurrentWindowId();
    }

    // to prevent the browser from closing itself
    // make sure there is another window
    await getAnotherWindow(windowId);

    if(title === undefined) {
        // if the `sessionTitle` value is not set `title` will still be undefined
        title = (await browser.sessions.getWindowValue(windowId, "sessionTitle")) as string;
    }

    // tab search query
    // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/query
    let queryInfo = {
        windowId: windowId
    };
    let tabs = await browser.tabs.query(queryInfo);
    
    let sessionId:SessionId = await createSessionFromTabs(tabs, setAside, title);

    return sessionId;
}

/**
 * Removes a session.
 * @param sessionId Bookmark id of the session folder.
 * @param keepTabs Whether to keep the tabs if the session is active.
 */
export async function removeSession(sessionId:SessionId, keepTabs:boolean = false):Promise<void> {
    // a simple check if activeSessions are enabled is not sufficient here
    // because there could still be active sessions left open
    let session:ActiveSession = ActiveSessionManager.getActiveSession(sessionId);

    if(session) {
        ActiveSessionManager.removeSession(sessionId, keepTabs);
    } else {
        ClassicSessionManager.removeSession(sessionId);
    }
}

export async function removeTabFromSession(tabBookmarkId:string):Promise<void> {
    let tabBookmark:Bookmark = (await browser.bookmarks.get(tabBookmarkId))[0];
    console.assert(tabBookmark);

    let sessionId:string = tabBookmark.parentId;
    let session:ActiveSession = ActiveSessionManager.getActiveSession(sessionId);
    
    if(session) {
        // session is active
        console.error("[TA] Removing a tab from an active session is currently not supported.");
        //TODO
        return;
    } else {
        // session is not active
        ClassicSessionManager.removeTabFromSession(tabBookmark);
    }
}

async function renameSession(sessionId:SessionId, title:string):Promise<void> {
    if(title.trim() === "") {
        return Promise.reject("Invalid session name.");
    }

    let sessionBookmark = (await browser.bookmarks.get(sessionId))[0];
    console.assert(sessionBookmark);

    await browser.bookmarks.update(sessionId, {title: title});

    // if the session is active, update it as well
    let activeSession = ActiveSessionManager.getActiveSession(sessionId);
    if(activeSession) {
        activeSession.updateTitle(title);
    }

    // update sidebar & menus
    SessionEvent.send(sessionId, "meta-update");
    updateBrowserActionContextMenu();
}

export async function getSessionBookmarks():Promise<Bookmark[]> {
    let rootFolderId:string = await OptionsManager.getValue("rootFolder");

    return browser.bookmarks.getChildren(rootFolderId);
}

let contextMenuEntries = [];

async function updateBrowserActionContextMenu():Promise<void> {
    const allSessions = await getSessionBookmarks();

    // remove old entries
    let oldEntries = contextMenuEntries;
    contextMenuEntries = [];
    await Promise.all(oldEntries.map(id => browser.menus.remove(id)))
        .catch(error => console.error("[TA] Failed to remove menu items.", error));

    // add new entries
    await Promise.all(allSessions
        .filter(b => ActiveSessionManager.getActiveSession(b.id) === undefined)
        .slice(0, browser.menus.ACTION_MENU_TOP_LEVEL_LIMIT)
        .map(b => {
            let itemId = browser.menus.create({
                contexts: ["browser_action"],
                id: b.id,
                title: browser.i18n.getMessage("browser_action_quick_restore", limit(b.title, 20)),
                onclick: () => restore(b.id, false)
            });

            contextMenuEntries.push(itemId);
        })
    ).catch(error => {
        console.error("[TA] Failed to create browser action context menu.", error);
    });
}
