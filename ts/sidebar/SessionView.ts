import * as TabViewFactory from "./TabViewFactory";
import {clean} from "../util/HTMLUtilities";

function i18n(messageName:string):string {
    return browser.i18n.getMessage("sidebar_"+messageName);
}

let template:HTMLTemplateElement = document.createElement("template");
template.innerHTML = clean(`
    <div class="header">
        <span class="title"></span>
        <span class="number-of-tabs"></span>
        <div class="align-right">
            <div class="controls">
                <div class="restore" title="${i18n("session_restore_tooltip")}">${i18n("session_restore")}</div>
                <div class="close">${i18n("session_close")}</div>
                <div class="more">...</div>
            </div>
        </div>
    </div>
    <div class="content"></div>
`);

export default class SessionView {
    public bookmarkId:string;

    private html:HTMLElement;
    private titleElement:HTMLElement;
    private tabCounter:HTMLElement;
    private tabViewContainer:HTMLElement;

    constructor(bookmark:browser.bookmarks.BookmarkTreeNode) {
        this.bookmarkId = bookmark.id;

        this.createHTML(bookmark);
        this.update();
    }

    public getHTML() {
        return this.html;
    }

    public async update() {
        let sessionBookmark:browser.bookmarks.BookmarkTreeNode = (await browser.bookmarks.getSubTree(this.bookmarkId))[0];
        this.titleElement.textContent = sessionBookmark.title;
        this.tabCounter.textContent = sessionBookmark.children.length + " tabs";
    }

    private createHTML(bookmark:browser.bookmarks.BookmarkTreeNode) {
        this.html = document.createElement("section");
        this.html.classList.add("session");    
        this.html.appendChild(document.importNode(template.content, true));

        this.titleElement = this.html.querySelector(".title");
        this.tabCounter = this.html.querySelector(".number-of-tabs");
        this.tabViewContainer = this.html.querySelector(".content");

        this.html.querySelector(".header").addEventListener("click", () => {
            this.toggle();
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

    public expand() {
        //let tabView = TabViewFactory.createTabView(this.bookmarkId);
        this.html.classList.add("expanded");
    }

    public collapse() {
        this.html.classList.remove("expanded");
    }
}