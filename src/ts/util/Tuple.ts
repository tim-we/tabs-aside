export default class Tuple2<S,T> {
	public first:S;
	public second:T;

	public constructor(fst:S, snd:T){
		this.first = fst;
		this.second = snd;
	}

	public toString():string {
		return "(" + this.first + ", " + this.second + ")";
	}
}