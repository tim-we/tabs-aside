(function () {
    const params = new URLSearchParams(document.location.search.substring(1));
    const url = new URL(params.get("url"));

    console.log("[TA] Found an unloaded tab from a previous version.", url);

    const a = document.getElementById("load-manually");
    a.href = url.href;
    document.getElementById("url").textContent = url.href;

    // try to load this URL
    window.location.href = url.href;
})();
