import { Message } from "../core/Messages";

document.addEventListener("DOMContentLoaded", () => {
	let searchInput:HTMLInputElement = document.getElementById("search-input") as HTMLInputElement;
	let noResultsInfo:HTMLElement = document.getElementById("search-no-results");
	noResultsInfo.textContent = browser.i18n.getMessage("sidebar_search_noresults");

	searchInput.placeholder = browser.i18n.getMessage("sidebar_search_placeholder");
	searchInput.setAttribute("aria-label", browser.i18n.getMessage("sidebar_search_placeholder"));
	searchInput.value = "";
	searchInput.focus();

	searchInput.addEventListener("input", async () => {
		let query:string = searchInput.value.trim();

		if(query === "") {
			showAll();
		} else {
			let results:Set<string> = await search(query);

			filterSessions(results);

			if(results.size === 0) {
				noResultsInfo.classList.add("show");
			} else {
				noResultsInfo.classList.remove("show");
			}
		}
	});

	document.getElementById("search-icon").addEventListener("click", () => {
		searchInput.focus();
	});

	window.addEventListener("keydown", e => {
		if(e.keyCode == 70 && e.ctrlKey) { // CTRL + F
			e.preventDefault();

			searchInput.focus();
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

browser.runtime.onMessage.addListener((message:Message) => {
	// TODO: listen for session updates and update sessionIds
});