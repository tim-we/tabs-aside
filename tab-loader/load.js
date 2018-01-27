(function () {
	let params = new URLSearchParams(document.location.search.substring(1));
	document.title = params.get("title") || document.title;
	let url = params.get("url");

	document.getElementById("load-manually").href = url;
	document.getElementById("url").innerText = url;
})();