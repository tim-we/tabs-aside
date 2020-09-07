import {
    Tab,
    Bookmark,
    TabCreateProperties,
    BookmarkCreateDetails,
    BookmarkChanges
} from "../util/Types";

type TitleData = {
    title:string,
    flags:Set<string>
    variables:Map<string,string>
};

/**
 * Regular expression that parses tab options and title from a bookmark title.
 * Example bookmark title: "[pinned,reading] Actual title"
 * 
 * possible flags:
 * 	reading:	reading mode
 * 	pinned:		whether the tab is pinned or not
 * 	src:		source code view
 * 
 * possible variables:
 * 	cs: (string) cookieStoreId, for containers
 */
const bmTitleParser = /^(\[(reading,|pinned,|src,|cs=[-\w]+?,)*(reading|pinned|src|cs=[-\w]+?)?\]\s)?(.*)$/;
const validURL = /^(https?|moz-extension):\/\//i;

const readerPrefix         = "about:reader?url=";
const viewSourcePrefix     = "view-source:";
const defaultCookieStoreId = "firefox-default";

interface TabDetails {
    pinned:boolean;
    isInReaderMode:boolean;
    title:string;
    url:string;
    favIconUrl:string|undefined;
    viewSource:boolean;
    cookieStoreId:string|undefined;
    index:number;
}

export default class TabData {
    public pinned:boolean;
    public isInReaderMode:boolean;
    public title:string;
    public url:string;
    public favIconUrl:string|undefined;
    public viewSource:boolean;
    public cookieStoreId:string|undefined;
    public index:number;

    private constructor(details:TabDetails) {
        this.pinned = details.pinned;
        this.isInReaderMode = details.isInReaderMode;
        this.title = details.title;
        this.url = details.url;
        this.favIconUrl = details.favIconUrl;
        this.viewSource = details.viewSource;
        this.cookieStoreId = details.cookieStoreId;
        this.index = details.index;

        let title = details.title.trim();
        this.title = title === "" ? this.getHostname() : title;

        // TabData instances should be immutable
        Object.freeze(this);
    }

    public static createFromTab(tab:Tab):TabData {
        let details = {
            pinned: tab.pinned,
            title: tab.title,
            url: tab.url,
            favIconUrl: tab.favIconUrl,
            viewSource: false,
            index: tab.index,
            cookieStoreId: undefined,
            isInReaderMode: false
        };
        

        if(tab.cookieStoreId !== defaultCookieStoreId) {
            details.cookieStoreId = tab.cookieStoreId;
        }
        
        if(tab.isInReaderMode) {
            details.isInReaderMode = true;
            // URL format
            // "about:reader?url=https%3A%2F%2Fexample.com%2Freader-compatible-page"
            details.url = decodeURIComponent(
                tab.url.substr(readerPrefix.length)
            );
        }

        if(tab.url.startsWith(viewSourcePrefix)) {
            details.url = tab.url.substr(viewSourcePrefix.length);
            details.viewSource = true;
        }

        return new TabData(details);
    }

    public static createFromBookmark(bookmark:Bookmark):TabData {
        let data:TitleData = this.decodeTitle(bookmark.title);

        let details = {
            url: bookmark.url,
            title: data.title,
            pinned: data.flags.has("pinned"),
            isInReaderMode: data.flags.has("reading"),
            viewSource: false,
            index: bookmark.index,
            favIconUrl: this.getFavIconURL(bookmark.url),
            cookieStoreId: undefined
        };

        if(data.flags.has("src")) {
            details.url = viewSourcePrefix + bookmark.url;
            details.viewSource = true;
        }

        if(data.variables.has("cs")) {
            details.cookieStoreId = data.variables.get("cs");
        }

        return new TabData(details);
    }

    public getTabCreateProperties(active:boolean = false):TabCreateProperties {
         // active, pinned and reader mode tabs, 'new tab' and "about" urls cannot be created and discarded
        let discardTab:boolean = !active
            && !this.pinned
            && !this.isInReaderMode
            && !(!this.url || this.url.startsWith("about:"));

        let url:string = this.url;

        if(url === "about:newtab") {
            url = undefined;
        }

        let createProperties:TabCreateProperties = {
            active: active,
            url: url,
            openInReaderMode: this.isInReaderMode,
            pinned: this.pinned,
            discarded: discardTab,
            index: this.index
        };

        if(this.cookieStoreId) {
            createProperties.cookieStoreId = this.cookieStoreId;
        }

        if(discardTab) {
            createProperties.title = this.title;
        }
        
        return createProperties;
    }

    public getBookmarkCreateDetails(parentId:string):BookmarkCreateDetails {
        return {
            parentId: parentId,
            title: this.encodeTitle(),
            url: this.url,
            index: this.index
        };
    }

    public getBookmarkUpdate():BookmarkChanges {
        return {
            title: this.encodeTitle(),
            url: this.url
        };
    }

    public isPrivileged():boolean {
        return !(validURL.test(this.url) || this.url === "about:newtab");
    }

    public getHostname():string {
        return (new URL(this.url)).hostname;
    }

    private encodeTitle():string {
        let tabOptions:string[] = [];

        if(this.isInReaderMode) {
            tabOptions.push("reading");
        }

        if(this.pinned) {
            tabOptions.push("pinned");
        }

        if(this.viewSource) {
            tabOptions.push("src");
        }

        if(this.cookieStoreId && defaultCookieStoreId !== this.cookieStoreId) {
            tabOptions.push("cs=" + this.cookieStoreId);
        }

        let prefix:string = (tabOptions.length > 0) ? 
            `[${tabOptions.join(",")}] ` : "";

        return prefix + this.title;
    }

    private static decodeTitle(title:string):TitleData {
        let matches:string[] = title.match(bmTitleParser);

        let data:string = matches[1] || "";
        let options:Set<string> = new Set();
        let variables:Map<string,string> = new Map();

        data.substring(1, data.length - 2).split(",").forEach(s => {
            if(s.includes("=", 2)) {
                let tmp = s.split("=");
                if(tmp.length === 2 && tmp[1].length > 0) {
                    variables.set(tmp[0], tmp[1]);
                }
            } else {
                options.add(s);
            }
        });

        return {
            title: matches[matches.length - 1].trim(),
            flags: options,
            variables: variables
        };
    }

    private static getFavIconURL(url:string):string {
        // guess the favicon path
        return (new URL(url)).origin + "/favicon.ico";

        // alternative:
        // link.href = "http://s2.googleusercontent.com/s2/favicons?domain=" + url.hostname;
    }
}
