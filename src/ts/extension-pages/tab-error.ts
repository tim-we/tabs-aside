import * as HTMLUtils from "../util/HTMLUtilities.js";
import { $$ } from "../util/HTMLUtilities.js";
import * as Clipboard from "../util/Clipboard.js";

(async function() {
    await HTMLUtils.DOMReady();

    // apply localization
    HTMLUtils.i18n();

    const urlBox:HTMLInputElement = <HTMLInputElement>document.getElementById("url");

    // expected URL parameters: url, error [, details]
    let params:URLSearchParams = new URL(window.location.href).searchParams;
    let url = params.get("url");
    let error = params.get("error") as "privileged"|"container";

    // avoid linking to this page
    if(url.startsWith(browser.runtime.getURL(window.location.pathname))) {
        params = new URL(url).searchParams;

        if(params.has("url")) {
            setTimeout(() => {
                window.location.href = url;
            }, 250);

            return;
        }
    }

    // error description & open button
    if(["privileged", "container"].includes(error)) {
        const description = $$("description");
        HTMLUtils.stringToParagraphs(
            browser.i18n.getMessage("tab_error_description_" + error)
        ).forEach(p => description.appendChild(p));

        if(error === "container") {
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
        }
    }

    // URL UI
    urlBox.value = url;
    urlBox.focus();
    urlBox.select();

    // URL-copy button
    let copyButton:HTMLElement = document.getElementById("copy");
    copyButton.onclick = () => {
        Clipboard.copyTextFromInput(urlBox);
    };

    // (optional) details section
    if(params.has("details")) {
        $$("code").innerText = params.get("details");
        $$("details-section").style.display = "block";
    }

})();
