// DOM references
var folderView;
var breadcrumbsView;
var selectButton;
var newFolderButton;

// url search params
var params = parseQueryString();

// state vars
var selectedFolderID = "";
var selectedFolder = null;
var oldSelectedFolderID = "";

// is there a selected folder?
var initPromise;
if (params["selected"]) {
	console.log(`ID ${params["selected"]} selected`);
	oldSelectedFolderID = params["selected"].trim();
	initPromise = init(oldSelectedFolderID);
} else {
	initPromise = init();
}

// updateView after window has loaded and bookmark data is ready (init)
Promise.all([
	initPromise,
	new Promise(resolve => {
		window.addEventListener("load", () => {
			// get DOM references
			folderView = document.getElementById("content-view");
			breadcrumbsView = document.getElementById("breadcrumbs");
			selectButton = document.getElementById("select");
			newFolderButton = document.getElementById("newfolder");

			// set up event listeners
			selectButton.addEventListener("click", () => {
				if (selectedFolderID) {
					alert("selected folder id: " + selectedFolderID);
					window.close();
				} else {
					alert("You need to select a folder.");
				}
			});

			resolve();
		});
	})
]).then(updateView);

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
		folderDIV.title = folder.title + ` (id: ${folder.id})`;

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

			resetSelection();

			navOpenFolder(i).then(() => {
				updateView();
			});

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
				resetSelection();

				navBreadcrumb(i).then(() => {
					updateView();
				});
			});
		}

		breadcrumbsView.appendChild(bcDIV);
	});
}