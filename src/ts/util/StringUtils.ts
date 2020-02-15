export function limit(str:string, maxLength:number):string {
    let n = maxLength - 3;

    return (str.length > n) ? str.substr(0,n).trim() + "..." : str;
}
