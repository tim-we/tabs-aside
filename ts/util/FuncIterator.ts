export default class FuncIterator<T> {
	private iterator:IterableIterator<T>;

	constructor(iterator:IterableIterator<T>) {
		this.iterator = iterator;
	}

	public map<S>(f: (value:T, index:number) => S):FuncIterator<S> {
		return new FuncIterator(_map(this.iterator, f));
	}

	public filter(p: (value:T, index:number) => boolean):FuncIterator<T> {
		return new FuncIterator(_filter(this.iterator, p));
	}

	public toArray():T[] {
		return Array.from(this.iterator);
	}

	public mapToArray<S>(f: (value:T, index:number) => S):S[] {
		return Array.from(this.iterator, f);
	}
}

function * _map<T,S>(iterable:IterableIterator<T>, f: (value:T, index:number) => S) {
	let i = 0;

	for (let x of iterable) {
		yield f(x, i++);
	}
}

function * _filter<T>(iterable:IterableIterator<T>, p: (value:T, index:number) => boolean) {
	let i = 0;

	for(let x of iterable) {
		if(p(x, i++)) {
			yield x;
		}
	}
}