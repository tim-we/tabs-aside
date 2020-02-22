import * as HTMLUtils from "../util/HTMLUtilities.js";
import { $$ } from "../util/HTMLUtilities.js";
import * as Clipboard from "../util/Clipboard.js";

(async function() {
    await HTMLUtils.DOMReady();

    // apply localization
    HTMLUtils.i18n();

    const urlBox:HTMLInputElement = <HTMLInputElement>document.getElementById("url");

    // expected URL parameters: url, error [, details]
    const params:URLSearchParams = new URL(window.location.href).searchParams;
    const url = params.get("url");
    const details = params.get("details") || "";

    // avoid linking to this page
    if(url.startsWith(browser.runtime.getURL(window.location.pathname))) {
        if(new URL(url).searchParams.has("url")) {
            setTimeout(() => {
                window.location.href = url;
            }, 250);

            return;
        }
    }

    if(details !== "") {
        const e = details.trim().toLowerCase();
        let description:string;

        if(e.includes("cookie store") || e.includes("contextual identities")) {
            description = browser.i18n.getMessage("tab_error_description_container");

            // open in default container button
            const button = $$("open");
            button.style.display = "block";
            button.addEventListener("click", async () => {
                const tab = await browser.tabs.getCurrent();
                browser.tabs.update(tab.id, {
                    url: url,
                    loadReplace: true
                });
            });
        } else if(e.includes("illegal url")) {
            if(url.startsWith("file:///")) {
                description = browser.i18n.getMessage("tab_error_description_files");
            } else {
                description = browser.i18n.getMessage("tab_error_description_privileged");
            }
        }

        if(description) {
            // show custom error description
            const d = $$("description");
            HTMLUtils.stringToParagraphs(description).forEach(p => d.appendChild(p));
        }
    }

    // URL UI
    urlBox.value = url;
    urlBox.focus();
    urlBox.select();

    // URL-copy button
    const copyButton:HTMLElement = document.getElementById("copy");
    copyButton.onclick = () => {
        Clipboard.copyTextFromInput(urlBox);
    };

    // (optional) details section
    if(params.has("details")) {
        $$("code").innerText = params.get("details");
        $$("details-section").style.display = "block";
    }

})();
