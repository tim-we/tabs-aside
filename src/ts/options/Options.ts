import { Option } from "./OptionTypeDefinition.js";

let optionsMap:Map<string, Option> = new Map<string, Option>();

(() => {
    let options:Option[] = [
        {
            id: "rootFolder",
            type: "bookmark",
            default: null,
            group: "core"
        },
        {
            id: "activeSessions",
            type: "boolean",
            default: true,
            info: true
        },
        {
            id: "windowedSession",
            type: "boolean",
            default: true
        },
        {
            id: "tabClosingBehavior",
            type: "select",
            options: ["remove-tab", "set-aside"],
            default: "remove-tab",
            info: true,
            activeOnly: true
        },
        {
            id: "lazyLoading",
            type: "boolean",
            default: true,
            info: true
        },
        {
            id: "ignorePinned",
            type: "boolean",
            default: true,
            hint: true
        },
        {
            id: "sidebarTabLayout",
            type: "select",
            options: ["simple-list"],
            default: "simple-list",
            hidden: true,
            group: "appearance"
        },
        {
            id: "browserActionContextIcon",
            type: "boolean",
            default: false,
            info: true,
            group: "appearance"
        },
        {
            id: "confirmSessionRemoval",
            type: "boolean",
            default: true,
            info: true
        },
        {
            id: "sessionTitleTemplate",
            type: "string",
            default: browser.i18n.getMessage("session_title_default")
        }
    ];

    optionsMap = options.reduce((m:Map<string, Option>, o:Option) => m.set(o.id, o), optionsMap);
})();

export default optionsMap;
