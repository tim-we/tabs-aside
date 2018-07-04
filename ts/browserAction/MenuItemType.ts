export interface MenuItem {
	id: string;
	optional?:boolean;
	shortcut?:string;
	onclick: (e:MouseEvent) => void;
}