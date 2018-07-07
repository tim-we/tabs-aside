import * as TabViewFactory from "./TabViewFactory";
import * as OptionsManager from "../options/OptionsManager";
import { OptionUpdateEvent, Message } from "../core/Messages";
import SessionView from "./SessionView";

// if one of these options changes reload the window
let optionsThatRequireReload:Set<string> = new Set<string>(["rootFolder", "sidebarTabLayout"]);

let rootId:string;

let sessionViews:SessionView[];
let sessionContainer:HTMLElement;

// initialize...
Promise.all([
    OptionsManager.getValue<string>("rootFolder").then(v => {
        if(v) {
            rootId = v;
            return Promise.resolve();
        } else {
            return Promise.reject();
        }
    }),

    TabViewFactory.init(),

    new Promise(resolve => {
        document.addEventListener("DOMContentLoaded", () => {
            sessionContainer= document.getElementById("sessions");

            resolve();
        });
    })

]).then(async () => {
    let sessions:browser.bookmarks.BookmarkTreeNode[] = await browser.bookmarks.getChildren(rootId);

    sessionViews = sessions.map(sessionBookmark => {
        let view = new SessionView(sessionBookmark);

        sessionContainer.appendChild(view.getHTML());

        return view;
    })
}).then(() => {
    browser.runtime.onMessage.addListener(messageHandler);
}).catch(e => {
    console.error("[TA] " + e);

    document.body.innerHTML = "Error";
});

function messageHandler(message:Message) {
    if(message.type === "OptionUpdate") {
        let msg:OptionUpdateEvent = message as OptionUpdateEvent;

        if(optionsThatRequireReload.has(msg.key)) {
            window.location.reload();
        }
    }
}

