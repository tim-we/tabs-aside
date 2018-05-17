export interface Message {
	type:string;
	destination: "all" | "sidebar" | "background" | "menu";
}