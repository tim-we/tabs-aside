import Options from "./Options.js";
import { Option } from "./OptionTypeDefinition.js";
import { OptionUpdateEvent } from "../messages/Messages.js";

let storage:browser.storage.StorageArea = browser.storage.local;

type ChangeListener = (v:any) => void;
let changeListeners:Map<string, Set<ChangeListener>> = new Map();

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

		// call change listeners and pass new value as argument
		(changeListeners.get(key) || new Set()).forEach(f => f(value));

		// notify other scripts about the update && ignore no receiver error
		OptionUpdateEvent.send(key, value).catch(() => {});
	}
}

export function addChangeListener(key:string, callback:ChangeListener):void {
	let listeners:Set<ChangeListener> = changeListeners.get(key) || new Set();
	listeners.add(callback);
	changeListeners.set(key, listeners);
}