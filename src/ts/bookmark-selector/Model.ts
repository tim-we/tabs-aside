import * as View from "./View.js";

type BMTreeNode = browser.bookmarks.BookmarkTreeNode;

export var selectedFolderID:string = "";
export var oldSelectedFolderID:string = "";
// folders in breadcrumbs:
var bcrumbs:browser.bookmarks.BookmarkTreeNode[] = [];
// folders in current view / folder
var folders:browser.bookmarks.BookmarkTreeNode[] = [];

var rootId:string;

export var OptionId:string;

export var FolderNamePreset:string = "Tabs Aside";

export function setFolderNamePreset(name:string):void {
	FolderNamePreset = name;
}

function makeBreadcrumbs(folder:BMTreeNode|BMTreeNode[]):Promise<void> {
	if (folder instanceof Array) { folder = folder[0]; }

	bcrumbs.unshift(folder);

	if (folder.parentId) {
		return browser.bookmarks.get(folder.parentId).then(makeBreadcrumbs);
	} else {
		// this is the root node
		rootId = folder.id;
	}

	return Promise.resolve();
}

export function init(option:string, bmFolderId?:string):Promise<any> {
	OptionId = option;

	if (bmFolderId) {
		return browser.bookmarks.get(bmFolderId).then(async function(data) {
			console.assert(data.length === 1);
			selectedFolderID = bmFolderId;
			oldSelectedFolderID = bmFolderId;

			let f = data[0];

			if (f.parentId) {
				await browser.bookmarks.get(f.parentId).then(makeBreadcrumbs);
			} else {
				// it's the root folder
				console.warn("Bookmark Folder Selector: root folder selected!");

				bcrumbs.push(f);
			}

			console.assert(bcrumbs.length > 0);

			f = bcrumbs[bcrumbs.length - 1];
			folders = await getSubFolders(f);

			return folders;
		}, err => {
			console.error("Bookmark Folder Selector: Folder not found!");
			return init(option);
		});
	} else {
		return browser.bookmarks.getTree().then(data => {
			console.assert(data.length === 1);
			return data[0];
		}).then(async root => {
			bcrumbs.push(root);
		
			folders = await getSubFolders(root);

			return Promise.resolve();
		});
	}
}

export function select(folderId:string, updateView:boolean = true):void {
	selectedFolderID = folderId;

	if(updateView) {
		View.update();
	}
}

export function clearSelection(updateView:boolean = true) {
	selectedFolderID = "";
	
	if(updateView) {
		View.update();
	}
}

export async function getSubFolders(bmFolderNode:browser.bookmarks.BookmarkTreeNode)
:Promise<browser.bookmarks.BookmarkTreeNode[]> {
	if (bmFolderNode.children === undefined) {
		bmFolderNode.children = await browser.bookmarks.getChildren(bmFolderNode.id);
	}

	return Promise.resolve(
		bmFolderNode.children.filter(bm => bm.type === "folder")
	);
}

export function refreshChildren():Promise<void> {
	return new Promise(async (resolve, reject) => {
		if (bcrumbs.length == 0) { reject("Invalid state"); }

		let f = bcrumbs[bcrumbs.length - 1];

		f.children = undefined;

		folders = await getSubFolders(f);

		resolve();
	});
}

export function navOpenFolder(fIndex:number):Promise<void> {
	return new Promise(async (resolve,reject) => {
		if (folders[fIndex]) {
			let f = folders[fIndex];
			bcrumbs.push(f);
			folders = await getSubFolders(f);
			
			View.update();
			resolve();
		} else {
			reject("Invalid folder index!");
		}
	});
}

export function navUp():Promise<void> {
	return new Promise(async (resolve, reject) => {
		if (bcrumbs.length > 1) {
			bcrumbs.pop();
			let f = bcrumbs[bcrumbs.length - 1];
			folders = await getSubFolders(f);
			
			View.update();
			resolve();
		} else {
			reject("Calm down. Can't go up that high!");
		}
	});
}

export function navBreadcrumb(bcIndex:number):Promise<void> {
	return new Promise(async (resolve, reject) => {
		if (bcrumbs[bcIndex]) {
			bcrumbs.length = bcIndex + 1;
			folders = await getSubFolders(bcrumbs[bcIndex]);
			
			View.update();
			resolve();
		} else {
			reject("No such breadcrumb :/");
		}
	});
}

export function createFolder(name:string):Promise<void> {
	return browser.bookmarks.create({
		title: name,
		type: "folder",
		parentId: bcrumbs[bcrumbs.length - 1].id
	}).then(bmFolder => {
		// auto-select new folder
		select(bmFolder.id, false);

		return refreshChildren();
	}, e => {
		alert("Error: Folder was not created.");
		console.error(e+"");
	}).then(() => {
		View.update();
	});
}

export function getFolders():browser.bookmarks.BookmarkTreeNode[] {
	return folders;
}

export function getBreadcrumbs():browser.bookmarks.BookmarkTreeNode[] {
	return bcrumbs;
}

export function getCurrentFolder():browser.bookmarks.BookmarkTreeNode {
	console.assert(bcrumbs.length > 0);

	return bcrumbs[bcrumbs.length - 1];
}

export function isRoot(folder:browser.bookmarks.BookmarkTreeNode):boolean {
	return folder && folder.id === rootId;
}