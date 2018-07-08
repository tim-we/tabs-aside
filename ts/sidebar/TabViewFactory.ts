import TabView from "./TabViews/TabView";
import * as OptionsManager from "../options/OptionsManager";

import SimpleList from "./TabViews/SimpleList";

let tabLayout:string = "simple-list";

export async function init() {
    tabLayout = await OptionsManager.getValue<string>("sidebarTabLayout");

    // load tab layout css

    let css:HTMLLinkElement = document.createElement("link");
    css.rel = "stylesheet";
    css.type = "text/css";
    css.href = "../css/tab-views/" + tabLayout + ".css";

    document.head.appendChild(css);
}

export function createTabView(bookmarkId:string):TabView {
    if(tabLayout === "simple-list") {
        return new SimpleList(bookmarkId);
    }

    return null;
}