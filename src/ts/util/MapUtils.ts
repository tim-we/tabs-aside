export function findKeyByValue<S,T>(map:Map<S,T>, value:T):S {
	let entries = map.entries();

	for(let x of entries) {
		if(x[1] === value) {
			return x[0];
		}
	}

	return null;
}