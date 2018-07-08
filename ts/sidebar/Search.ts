import { Message } from "../core/Messages";

document.addEventListener("DOMContentLoaded", () => {
    let searchInput:HTMLInputElement = document.getElementById("search-input") as HTMLInputElement;
    
    searchInput.placeholder = browser.i18n.getMessage("sidebar_search_placeholder");
    searchInput.value = "";

    searchInput.addEventListener("input", async () => {
        let query:string = searchInput.value.trim();

        if(query.length > 0) {
            let results:Set<string> = await search(query);

            console.log("[TA] search results: " + Array.from(results.values()).join(","));
        }
    });
});

let rootId:string;

// this set of bookmark ids is used to filter search results
let sessionIds:Set<string> = new Set<string>();

export async function init(sessionRootId:string) {
    rootId = sessionRootId;

    // initialize sessionIds
    let sessionBookmarks = await browser.bookmarks.getChildren(rootId);  
    sessionBookmarks.forEach(
        session => sessionIds.add(session.id)
    )
}

/**
 * searches the bookmarks for sessions matching the given query
 * @param query
 * @returns returns the results as a set of ids as a promise
 */
async function search(query:string):Promise<Set<string>> {
    let browserResults = await browser.bookmarks.search(query);

    let results:Set<string> = new Set<string>();

    browserResults.forEach(bm => {
        // ignore root node
        if(!bm.parentId) { return; }

        // is this bookmark a session or part of a session ?
        if(sessionIds.has(bm.id) || sessionIds.has(bm.parentId)) {
            results.add(bm.id);
        }
    });

    return results;
}

browser.runtime.onMessage.addListener((message:Message) => {
    // TODO: listen for session updates and update sessionIds
});