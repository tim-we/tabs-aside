// a script for freed tabs (session deleted but tabs kept)
// that recreates the automatic content loading behavior
(function() {
	let url = document.getElementById("load-manually");

	window.addEventListener("focus", () => {
		window.location = url;
	});
})();