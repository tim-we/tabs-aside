import { Tab, TabCreateProperties, Window } from "./Types";

export async function getCurrentWindowId():Promise<number> {
    let wnd = await browser.windows.getLastFocused({populate: false});

    return wnd ? wnd.id : browser.windows.WINDOW_ID_NONE;
}

export async function getCommandByName(name:string):Promise<browser.commands.Command> {
    let commands = await browser.commands.getAll();
    return commands.find(c => c.name === name);
}

const tabErrorUrl = browser.runtime.getURL("html/tab-error.html");

/**
 * Creates a new tab (just like `tabs.create`) but catches errors.
 * @param createProperties Same as `tabs.create`.
 */
export function createTab(createProperties:TabCreateProperties):Promise<Tab> {
    return browser.tabs.create(createProperties).then(tab => tab, error => {
        console.error("[TA] Failed to create tab: " + error, error);

        // create a tab that displays the error
        let params = new URLSearchParams();
        params.append("url", createProperties.url);
        params.append("details", error+"");

        return browser.tabs.create({
            active: createProperties.active,
            pinned: createProperties.pinned,
            windowId: createProperties.windowId,
            discarded: false,
            url: tabErrorUrl + "?" + params
        });
    });
}

/**
 * Returns a window object of a window with different windowId.
 * If no such window exists, a new one is created.
 * @param windowId
 */
export async function getAnotherWindow(windowId:number):Promise<Window> {
    console.assert(windowId !== browser.windows.WINDOW_ID_NONE);

    const allWindows = await browser.windows.getAll({windowTypes:["normal"]});
    const otherWindows = allWindows.filter(wnd => wnd.id !== windowId);

    if(otherWindows.length === 0) {
        console.log("[TA] Creating a new window to prevent the browser from closing...");
        let newWindow:Promise<Window> = browser.windows.create({});

        // hide the new window for now
        browser.windows.update(windowId, {focused: true});

        return newWindow;
    } else {
        return otherWindows[0];
    }
}
