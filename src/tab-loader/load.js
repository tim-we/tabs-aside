(function () {
    let params = new URLSearchParams(document.location.search.substring(1));
    let url = new URL(params.get("url"));

    console.log("[TA] Found an unloaded tab from a previous version.", url);

    let a = document.getElementById("load-manually");
    a.href = url.href;
    document.getElementById("url").textContent = url.href;

    // try to load this URL
    window.location.href = url.href;
})();