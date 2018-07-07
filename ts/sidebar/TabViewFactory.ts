import TabView from "./TabViews/TabView";
import * as OptionsManager from "../options/OptionsManager";

import SimpleList from "./TabViews/SimpleList";

let tabLayout:string = "simple-list";

export async function init() {
    tabLayout = await OptionsManager.getValue<string>("sidebarTabLayout");
}

export function createTabView(bookmarkId:string):TabView {
    if(tabLayout === "simple-list") {
        return new SimpleList(bookmarkId);
    }

    return null;
}