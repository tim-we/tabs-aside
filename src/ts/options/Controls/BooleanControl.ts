import { Option } from "../OptionTypeDefinition.js";
import * as OptionsManager from "../OptionsManager.js";

let instanceCounter = 0;

export async function create(row:HTMLDivElement, option:Option):Promise<void> {
    instanceCounter++;

    let checkbox:HTMLInputElement = document.createElement("input");
    checkbox.id = "checkbox" + instanceCounter;
    checkbox.type = "checkbox";
    checkbox.classList.add("browser-style");
    checkbox.checked = await OptionsManager.getValue<boolean>(option.id);

    let label = document.createElement("label");
    label.setAttribute("for", checkbox.id);
    label.innerText = browser.i18n.getMessage("option_" + option.id);

    checkbox.addEventListener("change", () => {
        OptionsManager.setValue(option.id, checkbox.checked);
    });

    row.appendChild(checkbox);
    row.appendChild(label);
}
