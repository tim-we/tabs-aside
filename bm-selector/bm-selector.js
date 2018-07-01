async function getSubFolders(bmFolderNode) {
	if (bmFolderNode.children === undefined) {
		bmFolderNode.children = await browser.bookmarks.getChildren(bmFolderNode.id);
	}

	return Promise.resolve(
		bmFolderNode.children.filter(bm => bm.type === "folder")
	);
}

var bcrumbs = [];
var folders = [];

function init(id) {
	if (id) {
		return browser.bookmarks.get(id).then(async function(data) {
			console.assert(data.length === 1);
			
			function makeBreadcrumbs(folder) {
				if (folder instanceof Array) { folder = folder[0]; }

				bcrumbs.unshift(folder);

				if (folder.parentId) {
					return browser.bookmarks.get(folder.parentId).then(makeBreadcrumbs);
				}

				return Promise.resolve();
			}

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
			console.error("Bookmark Folder Selector: ID not found!");
			return init();
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

function navOpenFolder(fIndex) {
	return new Promise(async (resolve,reject) => {
		if (folders[fIndex]) {
			let f = folders[fIndex];
			bcrumbs.push(f);
			folders = await getSubFolders(f);
	
			resolve();
		} else {
			reject("Invalid folder index!");
		}
	});
}

function navUp() {
	return new Promise(async (resolve, reject) => {
		if (bcrumbs.length > 1) {
			bcrumbs.pop();
			let f = bcrumbs[bcrumbs.length - 1];
			folders = await getSubFolders(f);
	
			resolve();
		} else {
			reject("Calm down. Can't go up that high!");
		}
	});
}

function navBreadcrumb(bcIndex) {
	return new Promise(async (resolve, reject) => {
		if (bcrumbs[bcIndex]) {
			bcrumbs.length = bcIndex + 1;
			folders = await getSubFolders(bcrumbs[bcIndex]);
	
			resolve();
		} else {
			reject("No such breadcrumb :/");
		}
	});
}

function refreshChildren() {
	return new Promise(async (resolve, reject) => {
		if (bcrumbs.length == 0) { reject("Invalid state"); }

		let f = bcrumbs[bcrumbs.length - 1];

		f.children = undefined;

		folders = await getSubFolders(f);

		resolve();
	});
}