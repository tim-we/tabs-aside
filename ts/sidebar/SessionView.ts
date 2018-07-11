import * as TabViewFactory from "./TabViewFactory";
import {clean} from "../util/HTMLUtilities";
import TabView from "./TabViews/TabView";

type Bookmark = browser.bookmarks.BookmarkTreeNode;

function i18n(messageName:string):string {
	return browser.i18n.getMessage("sidebar_"+messageName);
}

let template:HTMLTemplateElement = document.createElement("template");
template.innerHTML = clean(`
	<div class="header" data-id="">
		<span class="title"></span>
		<span class="number-of-tabs"></span>
		<div class="align-right">
			<div class="controls">
				<div class="restore" title="${i18n("session_restore_tooltip")}">${i18n("session_restore")}</div>
				<div class="close">${i18n("session_close")}</div>
				<div class="more" title="${i18n("session_more")}"></div>
			</div>
		</div>
	</div>
	<div class="tab-view"></div>
`);

export default class SessionView {
	public bookmarkId:string;

	private html:HTMLElement;
	private titleElement:HTMLElement;
	private tabCounter:HTMLElement;
	private tabViewContainer:HTMLElement;

	private tabView:TabView = null;

	constructor(bookmark:Bookmark) {
		this.bookmarkId = bookmark.id;

		this.createHTML(bookmark);
		this.update();
	}

	public getHTML() {
		return this.html;
	}

	public async update() {
		let sessionBookmark:Bookmark = (await browser.bookmarks.getSubTree(this.bookmarkId))[0];
		this.titleElement.textContent = sessionBookmark.title;
		this.tabCounter.textContent = browser.i18n.getMessage(
			"sidebar_session_number_of_tabs",
			sessionBookmark.children.length+""
		);

		if(this.tabView) {
			this.tabView.update(sessionBookmark.children);
		}
	}

	private createHTML(bookmark:Bookmark) {
		this.html = document.createElement("section");
		this.html.classList.add("session");
		this.html.dataset.id = bookmark.id;
		this.html.appendChild(document.importNode(template.content, true));

		this.titleElement = this.html.querySelector(".title");
		this.tabCounter = this.html.querySelector(".number-of-tabs");
		this.tabViewContainer = this.html.querySelector(".tab-view");

		let header:HTMLElement = this.html.querySelector(".header");

		// click on session header -> toggle tab visibility
		header.addEventListener("click", () => {
			this.toggle();
		});

		// do not toggle tab visibility when clicking controls
		header.querySelector(".controls").addEventListener("click", e => {
			e.stopPropagation();
		});
	}

	public toggle() {
		if(this.isExpanded()) {
			this.collapse();
		} else {
			this.expand();
		}
	}

	public isExpanded() {
		return this.html.classList.contains("expanded");
	}

	public async expand(data?:Bookmark[]) {
		// create TabView
		let tabView:TabView = TabViewFactory.createTabView(this.bookmarkId);
		this.tabView = tabView;

		// optimization: if data is already available do not hit API again
		let tabBMs:Bookmark[] = (data instanceof Array) ? 
			data : (await browser.bookmarks.getChildren(this.bookmarkId));

		this.tabViewContainer.appendChild(
			tabView.createHTML(tabBMs)
		);

		this.html.classList.add("expanded");
	}

	public collapse() {
		this.html.classList.remove("expanded");

		// remove tab view
		this.tabViewContainer.innerHTML = "";
		this.tabView = null;
	}
}