import Options from "./options";

document.addEventListener("DOMContentLoaded", _ => {
	let section = document.getElementById("main-section");
	let i = 0;

	// iterate over options
	for(let optionKey in Options) {
		let option = Options[optionKey];

		let row:HTMLDivElement = document.createElement("div");
		row.classList.add("row");
		row.classList.add(option.type);

		if(option.type === "boolean") {
			let checkbox:HTMLInputElement = document.createElement("input");
			checkbox.id = "checkbox" + i;
			checkbox.type = "checkbox";
			checkbox.classList.add("browser-style");

			let label = document.createElement("label");
			label.setAttribute("for", checkbox.id);
			label.innerText = browser.i18n.getMessage("option_" + optionKey);

			row.appendChild(checkbox);
			row.appendChild(label);
		}

		section.appendChild(row);
		i++;
	}
});