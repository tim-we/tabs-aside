import Options from "./Options";

let storage:browser.storage.StorageArea = browser.storage.local;

export function getValue<T>(key:string):Promise<T> {
	return storage.get("options").then(data => {
		let storedOptions = data["options"] as {[s:string]: any} || {};

		let value = (storedOptions[key] !== undefined) ? storedOptions[key] : Options[key].default;

		return value as T;
	});
}

export function setValue<T>(key:string, value:T):Promise<void> {
	return storage.get("options").then(data => {
		let storedOptions = data["options"] as {[s:string]: any} || {};

		let oldValue:T = (storedOptions[key] !== undefined) ? storedOptions[key] : Options[key].default;

		storedOptions[key] = value;

		return storage.set({"options": storedOptions}).then(_ => {
			if(Options[key].onchange) {
				Options[key].onchange(value, oldValue);
			}
		});
	});
}