import Options from "./Options";
import { OptionUpdateEvent } from "../core/Messages";

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

		if(value === oldValue) {
			// if value has not changed abort here
			return Promise.resolve();
		} else {
			// otherwise update options
			storedOptions[key] = value;

			return storage.set({"options": storedOptions}).then(_ => {
				console.log(`[TA] Option ${key} updated.`);

				if(Options[key].onchange) {
					// invoke onchange event listener
					Options[key].onchange(value, oldValue);
				}
			}).then(_ => {
				// notify other scripts about the update
				browser.runtime.sendMessage<OptionUpdateEvent, void>({
					type: "OptionUpdate",
					destination: "all",
					key: key,
					newValue: value
				});
			});
		}
	});
}