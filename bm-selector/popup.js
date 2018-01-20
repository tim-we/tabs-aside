var folderView;
var breadcrumbsView;
var selectedFolderID = "";
var selectedFolder = null;
var oldSelectedFolderID = "";

Promise.all([init(), new Promise(resolve => {
	window.addEventListener("load", () => {
		folderView = document.getElementById("content-view");
		breadcrumbsView = document.getElementById("breadcrumbs");
		resolve();
	});
})]).then(updateView);

function resetSelection() {
	selectedFolderID = "";
	if (selectedFolder) {
		selectedFolder.classList.remove("selected");
	}
	selectedFolder = null;
}

function updateView() {
	// update folder view
	folderView.innerHTML = "";

	folders.forEach((folder,i) => {
		let folderDIV = document.createElement("div");
		folderDIV.classList.add("folder");

		folderDIV.innerText = folder.title;

		if (folder.id === selectedFolderID) {
			folderDIV.classList.add("selected");
			selectedFolder = folderDIV;
		}

		if (folder.id === oldSelectedFolderID) {
			folderDIV.classList.add("oldselection");
		}

		folderDIV.addEventListener("click", () => {
			resetSelection();
			selectedFolderID = folder.id;
			selectedFolder = folderDIV;
			folderDIV.classList.add("selected");
		});

		folderDIV.addEventListener("dblclick", e => {
			e.stopPropagation();

			navOpenFolder(i);
			resetSelection();
			updateView();

			return false;
		});

		folderView.appendChild(folderDIV);
	});

	// update breadcrumbs view
	breadcrumbsView.innerHTML = "";

	bcrumbs.forEach((bc,i) => {
		let bcDIV = document.createElement("div");
		bcDIV.classList.add("breadcrumb");

		let name = (i === 0) ? "root" : bc.title;
		bcDIV.innerText = name;

		if (i < bcrumbs.length - 1) {
			bcDIV.addEventListener("click", () => {
				navBreadcrumb(i);
				resetSelection();
				updateView();
			});
		}

		breadcrumbsView.appendChild(bcDIV);
	});
}