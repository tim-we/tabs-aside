import * as OptionsManager from "../../Options/OptionsManager.js";

interface OptionsPreset {
	options:{[id:string]: boolean|string};
}

export let Edge:OptionsPreset = {
	options: {
		"activeSessions": false,
		"windowedSession": false
	}
};

export let Classic:OptionsPreset = {
	options: {
		"activeSessions": true,
		"windowedSession": false
	}
};

export async function apply(preset:OptionsPreset):Promise<void> {
	for(let key of Object.keys(preset.options)) {
		console.log("setting " + key + " to " + preset.options[key]);
		await OptionsManager.setValue(key, preset.options[key]);
	}
}