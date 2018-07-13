import Options from "./Options";
import { Option } from "./OptionTypeDefinition";
import { OptionUpdateEvent } from "../core/Messages";

let storage:browser.storage.StorageArea = browser.storage.local;

export async function getValue<T>(key:string):Promise<T> {
	// receive stored options from the storage API
	let storedOptions = (await storage.get("options"))["options"] as {[s:string]: any} || {};

	// get option definition
	let option:Option = Options.get(key);

	let value = (storedOptions[key] !== undefined) ? storedOptions[key] : option.default;

	return value as T;
}

export async function setValue<T>(key:string, value:T, skipGuard:boolean = false) {
	// receive stored options from the storage API
	let storedOptions = (await storage.get("options"))["options"] as {[s:string]: any} || {};
	
	// get option definition
	let option:Option = Options.get(key);

	let oldValue:T = (storedOptions[key] !== undefined) ?
		storedOptions[key] : option.default;

	// if value has changed -> update options
	if(value !== oldValue) {
		storedOptions[key] = value;

		// update options (Storage API)
		await storage.set({"options": storedOptions});
		console.log(`[TA] Option ${key} updated.`);

		// notify other scripts about the update
		let updateEvent:OptionUpdateEvent = {
			type: "OptionUpdate",
			destination: "all",
			key: key,
			newValue: value
		};

		browser.runtime.sendMessage(updateEvent)
		// ignore no receiver error
		.catch(() => {});
	}
}