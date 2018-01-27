let a = document.getElementById("load-manually");

let params = new URLSearchParams(document.location.search.substring(1));
document.title = params.get("title") || document.title;
let url = params.get("url");
a.href = url;

document.addEventListener("visibilitychange", () => {
	document.location.replace(a.href);
}, false);