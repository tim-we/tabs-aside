import * as TabViewFactory from "./TabViewFactory.js";
import {clean} from "../util/HTMLUtilities.js";
import TabView from "./TabViews/TabView.js";
import { SessionCommand } from "../messages/Messages.js";
import * as EditText from "../util/EditText.js";
import SessionOptionsMenu from "./SessionOptionsMenu.js";
import { Bookmark } from "../util/Types.js";

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
                <div class="restore textbutton" title="${i18n("session_restore_tooltip")}">${i18n("session_restore")}</div>
                <div class="aside textbutton">${i18n("session_aside")}</div>
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
        this.updateMeta();
        this.updateTabs();
    }

    public getHTML() {
        return this.html;
    }

    public async updateMeta() {
        // cancel title editmode
        EditText.cancel(this.titleElement);

        let sessionBookmark:Bookmark = (await browser.bookmarks.get(this.bookmarkId))[0];
        
        this.titleElement.textContent = sessionBookmark.title;
    }

    public async updateTabs() {
        let tabs:Bookmark[] = await browser.bookmarks.getChildren(this.bookmarkId);

        this.tabCounter.textContent = browser.i18n.getMessage(
            "sidebar_session_number_of_tabs",
            tabs.length+""
        );

        if(this.tabView) {
            this.tabView.update(tabs);
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
        let controls:HTMLElement = header.querySelector(".controls");
        let moreButton:HTMLElement = controls.querySelector(".more");

        // click on session header -> toggle tab visibility
        header.addEventListener("click", () => this.toggle());

        // do not toggle tab visibility when clicking controls
        controls.addEventListener("click", e => e.stopPropagation());

        header.querySelector(".restore").addEventListener(
            "click", () => SessionCommand.send("restore", {sessionId: bookmark.id})
        );

        header.querySelector(".aside").addEventListener(
            "click", () => SessionCommand.send("set-aside", {sessionId: bookmark.id})
        );

        this.titleElement.addEventListener("click", e => {
            e.stopImmediatePropagation();
            e.stopPropagation();

            this.editTitle();
        });

        moreButton.addEventListener("click", () => {
            let menu = new SessionOptionsMenu(this);
            menu.showOn(moreButton);
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
        let tabView:TabView = TabViewFactory.createTabView(this);
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

    public setActiveState(active:boolean):void {
        if(active) {
            this.html.classList.add("active");
        } else {
            this.html.classList.remove("active");
        }
    }

    public isActive():boolean {
        return this.html.classList.contains("active");
    }

    public editTitle() {
        EditText.edit(
            this.titleElement,
            browser.i18n.getMessage("sidebar_session_title_edit_placeholder"),
            1
        ).then((newTitle:string) =>
            SessionCommand.send("rename", {
                sessionId: this.bookmarkId,
                title: newTitle
            })
        ).catch(error => console.log("[TA] Error", error));
    }
}
