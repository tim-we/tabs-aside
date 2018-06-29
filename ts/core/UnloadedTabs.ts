const TAB_LOADER_BASE_URL = browser.extension.getURL("tab-loader/load.html");

interface TabCreateProperties {
	active?:boolean,
	url:string
}

type TabActivationListener = (tabId:number) => any;

export class UnloadedTabs {
	private tabURLs:Map<number, string> = new Map<number, string>();

	private activateListeners:TabActivationListener[] = [];

	constructor() {
		browser.tabs.onActivated.addListener(this.handleTabActivated);
		browser.tabs.onRemoved.addListener(this.handleTabRemoved);
	}

	public addTabActivationListener(listener:TabActivationListener) {
		this.activateListeners.push(listener);
	}

	public getTabIds():number[] {
		return Array.from(this.tabURLs.keys());
	}

	public create(
		createProperties:TabCreateProperties,
		title?:string,
		favIconUrl?:string
	):Promise<browser.tabs.Tab> {
		createProperties.active = false;

		let url:string = createProperties.url;

		if(!title) { title = new URL(url).hostname; }

		createProperties.url = this.getTabLoaderURL(url, title);

		return browser.tabs.create(createProperties).then(tab => {
			this.tabURLs.set(tab.id as number, url);

			// use the browsers sessions API to store the actual URL
			// even if this extension is not running anymore
			browser.sessions.setTabValue(tab.id as number, "loadURL", url);

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
		let tabId:number = activeInfo.tabId;

		let url = this.tabURLs.get(tabId);

		if(url) {
			Promise.all([
				// remove session value
				browser.sessions.removeTabValue(tabId, "loadURL"),

				// load tab
				browser.tabs.update(tabId, { url: url })
			]).then(_ => {
				this.tabURLs.delete(tabId);

				// call event listeners
				this.activateListeners.forEach(f => f(tabId));
			});
		}
	}

	private handleTabRemoved(tabId:number, removeInfo:object) {
		this.tabURLs.delete(tabId);
	}
}