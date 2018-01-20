function getSubFolders(bmFolderNode) {
	// TODO: test with FF57
	return bmFolderNode.children.filter(node => node.type === "folder");
}

var bcrumbs = [];
var folders = [];

function init() {
	return browser.bookmarks.getTree().then(data => {
		console.assert(data.length === 1);
		return data[0];
	}).then(root => {
		bcrumbs.push(root);
	
		folders = getSubFolders(root);

		return folders;
	});
}

function navOpenFolder(fIndex) {
	if (folders[fIndex]) {
		let f = folders[fIndex];
		bcrumbs.push(f);
		folders = getSubFolders(f);

		return folders;
	} else {
		throw new Error("Invalid folder index!");
	}
}

function navUp() {
	if (bcrumbs.length > 1) {
		bcrumbs.pop();
		let f = bcrumbs[bcrumbs.length - 1];
		folders = getSubFolders(f);

		return folders;
	} else {
		throw new Error("Calm down. Can't go up that high!");
	}
}

function navBreadcrumb(bcIndex) {
	if (bcrumbs[bcIndex]) {
		bcrumbs.length = bcIndex + 1;
		folders = getSubFolders(bcrumbs[bcIndex]);

		return folders;
	} else {
		throw new Error("No such breadcrumb :/");
	}
}