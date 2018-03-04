(function () {
	let params = new URLSearchParams(document.location.search.substring(1));
	document.title = params.get("title") || document.title;
	let url = new URL(params.get("url"));

	document.getElementById("load-manually").href = url.href;
	document.getElementById("url").textContent = url.href;

	//set favicon
	let link = document.createElement('link');
	link.type = 'image/x-icon';
	link.rel = 'icon';
	link.href = url.origin + '/favicon.ico';

	// alternative:
	// link.href = "http://s2.googleusercontent.com/s2/favicons?domain=" + url.hostname;

	document.head.appendChild(link);
})();