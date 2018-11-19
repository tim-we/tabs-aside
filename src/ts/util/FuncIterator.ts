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

	public append(i:FuncIterator<T>|IterableIterator<T>):FuncIterator<T> {
		let iterator2:IterableIterator<T> = (i instanceof FuncIterator) ? i.iterator : i;

		return new FuncIterator(_append(this.iterator, iterator2));
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

function * _append<T>(iterable1:IterableIterator<T>, iterable2:IterableIterator<T>) {
	for(let x of iterable1) {
		yield x;
	}

	for(let x of iterable2) {
		yield x;
	}
}