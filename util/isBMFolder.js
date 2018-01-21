// tmp bookmark API fix
function isBMFolder(bm) {
	return bm.type === "folder" || !bm.url;
}