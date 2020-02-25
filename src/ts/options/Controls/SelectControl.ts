import { SelectOption } from "../OptionTypeDefinition.js";
import * as OptionsManager from "../OptionsManager.js";

let instanceCounter = 0;

export async function create(row:HTMLDivElement, option:SelectOption):Promise<void> {
    instanceCounter++;
    const value = await OptionsManager.getValue<string>(option.id);
    const i18nMessageName = "option_" + option.id;

    let select:HTMLSelectElement = document.createElement("select");
    select.id = "select" + instanceCounter;
    select.classList.add("browser-style");
    
    let selectOptions = option.options;

    selectOptions.forEach(o => {
        let selectOption:HTMLOptionElement = document.createElement("option");
        selectOption.value = o;
        selectOption.innerText = browser.i18n.getMessage(i18nMessageName + "__" + o) || "@ERROR";
        
        if(value === o) {
            selectOption.selected = true;
        }

        select.appendChild(selectOption);
    });

    let label:HTMLLabelElement = document.createElement("label");
    label.setAttribute("for", select.id);
    label.innerText = browser.i18n.getMessage(i18nMessageName) || "empty";

    select.addEventListener("change", () => {
        let x = select.options[select.selectedIndex].value;
        OptionsManager.setValue(option.id, x);
    });

    row.appendChild(label);
    row.appendChild(select);
}
