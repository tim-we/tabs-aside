import * as Model from "./Model";

// DOM references
var folderView:HTMLElement;
var breadcrumbsView:HTMLElement;
var selectButton:HTMLElement;
var newFolderButton:HTMLElement;

var selectedFolder = null;

export function init():void {
	// get DOM references
	folderView = document.getElementById("content-view");
	breadcrumbsView = document.getElementById("breadcrumbs");
	selectButton = document.getElementById("select");
	newFolderButton = document.getElementById("newfolder");

	// set up event listeners
	selectButton.addEventListener("click", () => {
		if (Model.selectedFolderID) {
			//window.close(); // does not work !!!
			browser.runtime.sendMessage({
				command: "updateRoot",
				bmID: Model.selectedFolderID
			});

			// the creator of this window is now expected to close it
		} else {
			alert("You need to select a folder.");
		}
	});

	newFolderButton.addEventListener("click", () => {
		// prompt does not work on mobile browsers
		let folderName = window.prompt(
			"Enter a name for the new folder",
			Model.FolderNamePreset
		);

		// check if prompt was aborted
		if (folderName === null) { return; }

		Model.clearSelection(false);

		Model.createFolder(folderName || Model.FolderNamePreset);
	});
}

export function unselect():void {
	if (selectedFolder) {
		selectedFolder.classList.remove("selected");
	}

	selectedFolder = null;
}

export function update():void {
	// update folder view
	folderView.innerHTML = "";

	Model.getFolders().forEach((folder,i) => {
		let folderDIV = document.createElement("div");
		folderDIV.classList.add("folder");

		folderDIV.textContent = folder.title;
		folderDIV.title = folder.title + ` (id: ${folder.id})`;

		if (folder.id === Model.selectedFolderID) {
			folderDIV.classList.add("selected");
			selectedFolder = folderDIV;
		}

		if (folder.id === Model.oldSelectedFolderID) {
			folderDIV.classList.add("oldselection");
		}

		folderDIV.addEventListener("click", () => {
			Model.select(folder.id);
			selectedFolder = folderDIV;
			folderDIV.classList.add("selected");
		});

		folderDIV.addEventListener("dblclick", e => {
			e.stopPropagation();

			Model.clearSelection(false);

			Model.navOpenFolder(i);

			return false;
		});

		folderView.appendChild(folderDIV);
	});

	// update breadcrumbs view
	breadcrumbsView.innerHTML = "";

	let bcrumbs = Model.getBreadcrumbs();

	bcrumbs.forEach((bc,i) => {
		let bcDIV = document.createElement("div");
		bcDIV.classList.add("breadcrumb");

		let name = (i === 0) ? "root" : bc.title;
		bcDIV.textContent = name;

		if (i < bcrumbs.length - 1) {
			bcDIV.addEventListener("click", () => {
				Model.clearSelection(false);

				Model.navBreadcrumb(i);
			});
		}

		breadcrumbsView.appendChild(bcDIV);
	});
}