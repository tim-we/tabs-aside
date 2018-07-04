export interface MenuItem {
	id: string;
	optional?:boolean; // default: false
	shortcut?:string; 
	icon?:string;
	onclick: (e:MouseEvent) => void;
	closeMenu?:boolean; // default: true
}