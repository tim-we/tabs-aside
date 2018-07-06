import Options from "./Options";
import { Option } from "./OptionTypeDefinition";
import { OptionUpdateEvent } from "../core/Messages";

let storage:browser.storage.StorageArea = browser.storage.local;

function getOption(optionId:string):Option {
	for(let i=0; i<Options.length; i++) {
		if(Options[i].id === optionId) {
			return Options[i];
		}
	}

	console.error(`[TA] Option ${optionId} not found.`);

	return null;
}

export function getValue<T>(key:string):Promise<T> {
	return storage.get("options").then(data => {
		let storedOptions = data["options"] as {[s:string]: any} || {};
		let option:Option = getOption(key);

		let value = (storedOptions[key] !== undefined) ? storedOptions[key] : option.default;

		return value as T;
	});
}

export function setValue<T>(key:string, value:T):Promise<void> {
	return storage.get("options").then(data => {
		let storedOptions = data["options"] as {[s:string]: any} || {};
		let option:Option = getOption(key);

		let oldValue:T = (storedOptions[key] !== undefined) ? storedOptions[key] : option.default;

		if(value === oldValue) {
			// if value has not changed abort here
			return Promise.resolve();
		} else {
			// otherwise update options
			storedOptions[key] = value;

			return storage.set({
				"options": storedOptions
			}).then(_ => {
				console.log(`[TA] Option ${key} updated.`);

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