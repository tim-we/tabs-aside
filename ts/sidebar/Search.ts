document.addEventListener("DOMContentLoaded", () => {
    let search:HTMLInputElement = document.getElementById("search-input") as HTMLInputElement;
    
    search.placeholder = browser.i18n.getMessage("sidebar_search_placeholder");
});

export function init() {

}