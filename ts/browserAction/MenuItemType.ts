export interface MenuItem {
	id: string;
	optional?:boolean; // default: false
	shortcut?:string; 
	icon?:string;
	wideIcon?:boolean; // default: false
	onclick: (e:MouseEvent) => void;
	closeMenu?:boolean; // default: true
	tooltip?:boolean; // default: false
}