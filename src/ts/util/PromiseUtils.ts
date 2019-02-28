export function attempt(promise:Promise<any>):Promise<void> {
	return promise.catch(() => {});
}