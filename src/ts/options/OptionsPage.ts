import * as OptionsManager from "./OptionsManager.js";
import Options from "./Options.js";
import * as HTMLUtilities from "../util/HTMLUtilities.js";
import * as MessageListener from "../messages/MessageListener.js";

import * as BooleanControl from "./Controls/BooleanControl.js";
import * as BookmarkControl from "./Controls/BookmarkControl.js";
import * as SelectControl from "./Controls/SelectControl.js";
import * as StringControl from "./Controls/StringControl.js";

MessageListener.setDestination("options-page");
MessageListener.add("OptionUpdate", () => {
    // this will only be triggered by option updates from other pages
    window.location.reload();
})

document.addEventListener("DOMContentLoaded", async () => {
    HTMLUtilities.i18n();

    // Multiple options depend on the active session option
    if(await OptionsManager.getValue<boolean>("activeSessions")) {
        document.body.classList.add("active-sessions");
    }
    // react to changes
    OptionsManager.addChangeListener("activeSessions", (newValue:boolean) => {
        if(newValue) {
            document.body.classList.add("active-sessions");
        } else {
            document.body.classList.remove("active-sessions");
        }
    });

    let section = document.getElementById("main-section");

    // iterate over options
    Options.forEach(async option => {
        const i18nMessageName = "option_" + option.id;

        // skip hidden options
        if(option.hidden) { return; }

        // create row
        let row:HTMLDivElement = document.createElement("div");
        row.classList.add("row", "browser-style", option.type);

        if(option.type === "boolean") {
            await BooleanControl.create(row, option);
        } else if(option.type === "select") {
            await SelectControl.create(row, option);
        } else if(option.type === "bookmark") {
            await BookmarkControl.create(row, option);
        } else if(option.type === "string") {
            await StringControl.create(row, option);
        } else {
            console.warn("[TA] Unknown option type.", option);
            return;
        }

        if(option.hint) {
            row.title = browser.i18n.getMessage(i18nMessageName + "_hint");
        }

        if(option.info) {
            row.appendChild(document.createElement("br"));
            
            let info:HTMLParagraphElement = document.createElement("p");
            info.innerHTML = browser.i18n.getMessage(i18nMessageName + "_info");
            info.classList.add("info");
            row.appendChild(info);
        }

        if(option.activeOnly) {
            row.classList.add("active-only");
        }

        // append row
        section.appendChild(row);
    });
});
