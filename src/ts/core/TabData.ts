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

export default class TabData {
    public readonly pinned:boolean;
    public readonly isInReaderMode:boolean;
    public readonly title:string;
    public readonly url:string;
    public readonly favIconUrl:string;
    public readonly viewSource:boolean;
    public readonly cookieStoreId:string;
    public readonly index:number;

    public static createFromTab(tab:Tab):TabData {
        return new TabData(tab, null);
    }

    public static createFromBookmark(bookmark:Bookmark):TabData {
        return new TabData(null, bookmark);
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

    private constructor(tab:Tab, bookmark:Bookmark) {
        if(tab) { // create from tab
            this.pinned = tab.pinned;
            this.title = tab.title;
            this.url = tab.url;
            this.favIconUrl = tab.favIconUrl;
            this.viewSource = tab.url.startsWith(viewSourcePrefix);
            this.index = tab.index;

            if(tab.cookieStoreId !== defaultCookieStoreId) {
                this.cookieStoreId = tab.cookieStoreId;
            }
            
            if(tab.isInReaderMode) {
                this.isInReaderMode = true;
                // URL format
                // "about:reader?url=https%3A%2F%2Fexample.com%2Freader-compatible-page"
                this.url = decodeURIComponent(
                    tab.url.substr(readerPrefix.length)
                );
            } else {
                this.isInReaderMode = false;
            }

            if(this.viewSource) {
                this.url = this.url.substr(viewSourcePrefix.length);
            }
        } else if(bookmark) { // create from bookmark
            let data:TitleData = this.decodeTitle(bookmark.title);

            this.url = bookmark.url;
            this.title = data.title;
            this.pinned = data.flags.has("pinned");
            this.isInReaderMode = data.flags.has("reading");
            this.viewSource = data.flags.has("src");
            this.index = bookmark.index;

            this.favIconUrl = this.getFavIconURL(bookmark.url);

            if(this.viewSource) {
                this.url = viewSourcePrefix + this.url;
            }

            if(data.variables.has("cs")) {
                this.cookieStoreId = data.variables.get("cs");
            }
        }

        if(this.title.trim() === "") {
            this.title = this.getHostname();
        }
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

    private decodeTitle(title:string):TitleData {
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

    private getFavIconURL(url:string):string {
        // guess the favicon path
        return (new URL(url)).origin + "/favicon.ico";

        // alternative:
        // link.href = "http://s2.googleusercontent.com/s2/favicons?domain=" + url.hostname;
    }
}