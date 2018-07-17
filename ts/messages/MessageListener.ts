import { Message, MessageDestination, MessageType } from "./Messages";

export type MessageListener = (m:Message) => void;
type MessageTypeSelector = MessageType | "*";

let destination:MessageDestination = null;
let listeners:Map<MessageTypeSelector, Set<MessageListener>> = new Map();

export function setDestination(dest:MessageDestination):void {
	console.assert(dest !== "all");
	destination = dest;
}

export function add(type:MessageTypeSelector, listener:MessageListener):void {
	console.assert(destination !== null);

	let typeListeners:Set<MessageListener> = listeners.get(type) || new Set();
	typeListeners.add(listener);
	listeners.set(type, typeListeners);
};

export function remove(type:MessageTypeSelector, listener:MessageListener):void {
	let typeListeners:Set<MessageListener> = listeners.get(type);

	console.assert(typeListeners, "No message listeners for " + type);

	typeListeners.delete(listener);
}

browser.runtime.onMessage.addListener((message:Message) => {
	if(message.destination !== "all" && message.destination !== destination) {
		return;
	}

	let typeListeners:Set<MessageListener> = listeners.get(message.type) || new Set();
	typeListeners.forEach(f => f(message));

	let all:Set<MessageListener> = listeners.get("*") || new Set();
	all.forEach(f => f(message));
});