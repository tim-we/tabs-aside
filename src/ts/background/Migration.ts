import { attempt } from "../util/PromiseUtils.js";
import * as OptionsManager from "../options/OptionsManager.js";

let setupRequired:boolean = false;
let restartRequired:boolean = false;

export function isSetupRequired():boolean {
    return setupRequired;
}

type StoredData = {
    "version"?:number,
    "options"?:any, // user options
    "setup"?:boolean, // (user) setup completed flag
    "bookmarkFolderID"?:string // legacy
    "ba-icon"?:string // legacy
};

const CURRENT_DATA_VERSION = 3;

export async function run() {
    let data:StoredData = await browser.storage.local.get() || {};

    if(data.version === CURRENT_DATA_VERSION && data.setup === true) {
        // everything is up to date, nothing has to be done here
        return;
    }

    setupRequired = data.setup !== true;

    if(data.version && data.version < CURRENT_DATA_VERSION) {
        if(data.version === 2) {
            await migrateFromVersion3_3_(data);
        } else if(data.version == 1) {
            setupRequired = true;
            await migrateFromOldVersion(data);
        }
    } else {
        setupRequired = true;

        // removing the extension will also remove all the stored data
        // lets check if there exists a "Tabs Aside" folder from a previous installation
        let folders = (await browser.bookmarks.search({title:"Tabs Aside"}))
                    .filter(bm => bm.type === "folder");

        if(folders.length > 0) {
            console.log("[TA] Found a folder named 'Tabs Aside', probably from a previous installation.");
            await OptionsManager.setValue("rootFolder", folders[0].id);
        }
    }

    await browser.storage.local.set({"version": CURRENT_DATA_VERSION});

    if(restartRequired) {
        browser.runtime.reload();
    }
}

async function migrateFromOldVersion(data:StoredData){
    console.assert(data.version === 1 || data.version === undefined);

    if(data["bookmarkFolderID"]) {
        // this will not be removed to keep old versions working
        await attempt(browser.bookmarks.get(data["bookmarkFolderID"]).then(
            async (bms) => {
                if(bms[0].type === "folder") {
                    console.log("[TA] Found 'Tabs Aside' folder from a previous installation.");
                    await OptionsManager.setValue("rootFolder", bms[0].id);
                }
            }
        ));
    }

    if(data["ba-icon"]) {
        // use old browser action icon setting
        if(data["ba-icon"] === "dynamic") {
            await OptionsManager.setValue<boolean>("browserActionContextIcon", true);
        }

        browser.storage.local.remove("ba-icon");
    }
}

/**
 * Migrate extension data from v3.3.* to {current}
 * Changes: option ignorePinned -> asidePinnedTabs (issue #74)
 * @param data
 */
async function migrateFromVersion3_3_(data:StoredData) {
    console.assert(data.version === 2);

    if(data.options.ignorePinned !== undefined) {
        restartRequired = true;
        await OptionsManager.setValue("asidePinnedTabs", !data.options.ignorePinned);
    }
}
