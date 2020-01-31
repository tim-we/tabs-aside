import { StateInfoData } from "../messages/Messages.js";

export interface MenuItem {
	id: string;
	optional?:boolean; // default: false
	shortcut?:string;
	icon?:string;
	wideIcon?:boolean; // default: false
	onclick?: (state:StateInfoData) => void;
	closeMenu?:boolean; // default: true
	tooltip?:boolean; // default: false
	href?:string;
	isApplicable?:(state:StateInfoData) => boolean;
	hide?:(state:StateInfoData) => boolean;
}