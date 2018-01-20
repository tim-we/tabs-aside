function parseQueryString() {
	let objURL = {};

	window.location.search.replace(
		new RegExp("([^?=&]+)(=([^&]*))?", "g"),
		($0, $1, $2, $3) => { objURL[ $1 ] = $3; }
	);

	return objURL;
};

// let params = parseQueryString(); params["foo"] = "bar" ...