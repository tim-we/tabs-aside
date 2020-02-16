import { SessionEvent } from "../messages/Messages.js";
import * as MessageListener from "../messages/MessageListener.js";
import { $$ } from "../util/HTMLUtilities.js";

MessageListener.setDestination("sidebar");

document.addEventListener("DOMContentLoaded", () => {
    // find HTML elements
    const searchInput = $$("search-input") as HTMLInputElement;
    const searchClear = $$("search-clear") as HTMLButtonElement;
    const noResultsInfo:HTMLElement = $$("search-no-results");

    // set up attributes
    noResultsInfo.textContent = browser.i18n.getMessage("sidebar_search_noresults");
    searchClear.title = browser.i18n.getMessage("sidebar_search_clear");
    searchClear.setAttribute("aria-label", searchClear.title);

    searchInput.placeholder = browser.i18n.getMessage("sidebar_search_placeholder");
    searchInput.setAttribute("aria-label", searchInput.placeholder);
    searchInput.value = "";
    searchInput.focus();

    function clear() {
        searchInput.value = "";
        searchClear.classList.remove("show");
        showAll();
    }

    searchInput.addEventListener("input", async () => {
        let query:string = searchInput.value.trim();

        if(query === "") {
            searchClear.classList.remove("show");
            showAll();
        } else {
            searchClear.classList.add("show");
            let results:Set<string> = await search(query);

            filterSessions(results);

            if(results.size === 0) {
                noResultsInfo.classList.add("show");
            } else {
                noResultsInfo.classList.remove("show");
            }
        }
    });

    searchClear.addEventListener("click", clear);

    $$("search-icon").addEventListener("click", () => {
        searchInput.focus();
    });

    window.addEventListener("keydown", e => {
        if(e.key === "f" && e.ctrlKey) { // CTRL + F
            e.preventDefault();

            searchInput.focus();
        }
    });

    searchInput.addEventListener("keydown", e => {
        if(e.key === "Escape") {
            clear();
        }
    });
});

let rootId:string;

// this set of bookmark ids is used to filter search results
let sessionIds:Set<string> = new Set<string>();

let sessionContainer:HTMLElement;

export async function init(sessionRootId:string, container:HTMLElement) {
    rootId = sessionRootId;
    sessionContainer = container;

    // initialize sessionIds
    let sessionBookmarks = await browser.bookmarks.getChildren(rootId);
    sessionBookmarks.forEach(
        session => sessionIds.add(session.id)
    );
}

/**
 * searches the bookmarks for sessions matching the given query
 * @param query
 * @returns returns the results as a set of ids as a promise
 */
async function search(query:string):Promise<Set<string>> {
    let results:Set<string> = new Set<string>();

    let browserResults = await browser.bookmarks.search(query);

    browserResults.forEach(bm => {
        // ignore root node
        if(!bm.parentId) { return; }

        // is this bookmark a session or part of a session ?
        if(sessionIds.has(bm.id)) {
            results.add(bm.id);
        } else if(sessionIds.has(bm.parentId)) {
            results.add(bm.parentId);
        }
    });

    return results;
}

function filterSessions(filter:Set<string>):void {
    let sessionViews = sessionContainer.querySelectorAll<HTMLElement>(".session");

    sessionViews.forEach(session => {
        let id:string = session.dataset.id || "";

        if(filter.has(id)) {
            session.classList.remove("hidden");
        } else {
            session.classList.add("hidden");
        }
    });
}

function showAll() {
    let sessionViews = sessionContainer.querySelectorAll<HTMLElement>(".session");

    sessionViews.forEach(session => {
        session.classList.remove("hidden");
    });
}

MessageListener.add("SessionEvent", (e:SessionEvent) => {
    if(e.event === "created") {
        sessionIds.add(e.sessionId);
    } else if(e.event === "removed") {
        sessionIds.delete(e.sessionId);
    }
});
