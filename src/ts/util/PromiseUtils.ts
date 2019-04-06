export function attempt(promise:Promise<any>):Promise<void> {
	return promise.catch(() => {});
}

export function resolves(promise:Promise<any>):Promise<boolean> {
	return promise.then(
		() => Promise.resolve(true),
		() => Promise.resolve(false)
	);
}

export function rejects(promise:Promise<any>):Promise<boolean> {
	return promise.then(
		() => Promise.resolve(false),
		() => Promise.resolve(true)
	);
}

export function wait(time:number):Promise<void> {
	return new Promise(
		resolve => window.setTimeout(resolve, time)
	);
}