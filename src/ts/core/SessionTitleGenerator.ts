import * as OptionsManager from "../options/OptionsManager.js";
import { limit, formatDate } from "../util/StringUtils.js";

export async function generateSessionTitle():Promise<string> {
    let title = await OptionsManager.getValue<string>("sessionTitleTemplate");

    if(title.includes("$")) {
        title = formatDate(title, new Date());
    }

    return title;
}
