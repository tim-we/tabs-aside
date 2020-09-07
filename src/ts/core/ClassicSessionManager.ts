import * as OptionsManager from "../options/OptionsManager.js";
import TabData from "./TabData.js";
import { Tab, Window, Bookmark, SessionId } from "../util/Types.js";
import { SessionEvent, SessionContentUpdate } from "../messages/Messages.js";
import { createTab } from "../util/WebExtAPIHelpers.js";
import { generateSessionTitle } from "./SessionTitleGenerator.js";

export async function createSession(
    tabs:Tab[],
    setAside:boolean,
    sessionName?:string
):Promise<SessionId> {
    const rootFolderId:string = await OptionsManager.getValue<string>("rootFolder");

    if(!sessionName) {
        sessionName = await generateSessionTitle();
    }

    const sessionBookmark:Bookmark = await browser.bookmarks.create({
        title: sessionName||"session",//TODO
        type: "folder",
        parentId: rootFolderId,
        index: 0
    });

    const sessionId = sessionBookmark.id;

    for(let i=0; i<tabs.length; i++) {
        let tab:Tab = tabs[i];
        let data:TabData = TabData.createFromTab(tab);

        //TODO: is this check necessary?
        if(!data.isPrivileged()) {
            // create bookmark & close tab
            await Promise.all([
                browser.bookmarks.create(data.getBookmarkCreateDetails(sessionId)),
                setAside ? browser.tabs.remove(tab.id) : Promise.resolve()
            ]);
        }
    }

    await SessionEvent.send(sessionBookmark.id, "created");

    return sessionId;
}

/**
 * Classic restore function (just opens tabs, no active session)
 * @param sessionId
 */
export async function restore(sessionId:SessionId, keepBookmarks:boolean):Promise<void> {
    // let the browser handle these requests simultaneously
    let [[tabBookmark], openInNewWindow, lazyLoading] = await Promise.all([
        browser.bookmarks.getSubTree(sessionId),
        OptionsManager.getValue<boolean>("windowedSession"),
        OptionsManager.getValue<boolean>("lazyLoading")
    ]);

    let tabBookmarks:Bookmark[] = tabBookmark.children;
    let newTabId:number;

    if(openInNewWindow) {
        // create window for the tabs
        let wnd:Window = await browser.windows.create();
        newTabId = wnd.tabs[0].id;
        // avoid conflicts with pinned tabs
        await browser.tabs.update(newTabId, {pinned: true});

        if(keepBookmarks) {
            browser.sessions.setWindowValue(wnd.id, "sessionID", this.bookmarkId);
        } else {
            browser.sessions.setWindowValue(wnd.id, "sessionTitle", tabBookmark.title);
        }
    }

    // create tabs
    await Promise.all(
        tabBookmarks.map(bm => {
            let data:TabData = TabData.createFromBookmark(bm);
            let createProperties = data.getTabCreateProperties();

            if(!lazyLoading && createProperties.discarded) {
                createProperties.discarded = false;
            }

            if(newTabId !== undefined) {
                createProperties.index += 1;
            }

            return createTab(createProperties);
        })
    );

    // remove "new tab" tab that gets created automatically when creating a new window
    if(newTabId) {
        browser.tabs.remove(newTabId);
    }

    // (optional) remove bookmarks
    if(!keepBookmarks) {
        await browser.bookmarks.removeTree(sessionId);
        SessionEvent.send(sessionId, "removed");
    }
}

export async function removeSession(sessionId:SessionId):Promise<void> {
    // remove bookmarks
    await browser.bookmarks.removeTree(sessionId);

    // update views
    SessionEvent.send(sessionId, "removed");
}

export async function removeTabFromSession(tabBookmark:Bookmark):Promise<void> {
    let sessionId:string = tabBookmark.parentId;

    await browser.bookmarks.remove(tabBookmark.id);

    let tabs:Bookmark[] = await browser.bookmarks.getChildren(sessionId);

    if(tabs.length === 0) {
        removeSession(sessionId);
    } else {
        // update views
        SessionContentUpdate.send(sessionId);
    }
}
