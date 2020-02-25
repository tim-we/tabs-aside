import { StringOption } from "../OptionTypeDefinition.js";
import * as OptionsManager from "../OptionsManager.js";

let instanceCounter = 0;

export async function create(row:HTMLDivElement, option:StringOption) {
    instanceCounter++;

    let input = document.createElement("input");
    input.type = "text";
    input.id = "str-input-" + instanceCounter;
    input.classList.add("browser-style");
    input.value = await OptionsManager.getValue<string>(option.id);

    let timeoutId:number;

    async function update() {
        timeoutId = undefined;

        const newValue = input.value || option.default;
        await OptionsManager.setValue<string>(option.id, newValue);
        input.value = newValue;
    }

    input.addEventListener("input", () => {
        if(timeoutId) {
            window.clearTimeout(timeoutId);
        }

        timeoutId = window.setTimeout(update, 1500);
    });

    input.addEventListener("blur", () => {
        if(timeoutId) {
            window.clearTimeout(timeoutId);
        }

        input.value = input.value.trim();
        update();
    });

    let label = document.createElement("label");
    label.setAttribute("for", input.id);
    label.innerText = browser.i18n.getMessage("option_" + option.id);

    row.appendChild(label);
    row.appendChild(input);
}
