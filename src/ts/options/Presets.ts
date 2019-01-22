interface OptionsPreset {
	name:string;
	options:{[id:string]: boolean|string};
}

export let Edge:OptionsPreset = {
	name: "Edge",
	options: {
		"activeSessions": false,
		"windowedSession": false
	}
};

export let Classic:OptionsPreset = {
	name: "Classic",
	options: {
		"activeSessions": true,
		"windowedSession": false
	}
};