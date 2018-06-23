import { Tab } from "../core/Tab";

const TAB_LOADER_BASE_URL = browser.extension.getURL("tab-loader/load.html");

interface TabCreateProperties {
	active?:boolean,
	url:string
}

export class TabLoader {
	private unloadedTabs:Map<number, string> = new Map<number, string>();

	constructor() {
		browser.tabs.onActivated.addListener(this.handleTabActivated);
		browser.tabs.onRemoved.addListener(this.handleTabRemoved);
	}

	public createUnloadedTab(
		createProperties:TabCreateProperties,
		title?:string,
		favIconUrl?:string
	):Promise<browser.tabs.Tab> {
		createProperties.active = false;

		let url:string = createProperties.url;

		if(!title) { title = new URL(url).hostname; }

		createProperties.url = this.getTabLoaderURL(url, title);

		return browser.tabs.create(createProperties).then(tab => {
			//@ts-ignore TS2345
			this.unloadedTabs.set(tab.id, url);
			return tab;
		});
	}

	private getTabLoaderURL(url:string, title:string):string {
		return TAB_LOADER_BASE_URL + "?" + [
			`url=${encodeURIComponent(url)}`,
			`title=${encodeURIComponent(title)}`
		].join("&");
	}

	private handleTabActivated(activeInfo:{tabId:number, windowId:number}) {
		// TODO
		this.unloadedTabs.delete(activeInfo.tabId);
	}

	private handleTabRemoved(tabId:number, removeInfo:object) {
		this.unloadedTabs.delete(tabId);
	}
}