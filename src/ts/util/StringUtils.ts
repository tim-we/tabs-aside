export function limit(str:string, maxLength:number):string {
    let n = maxLength - 3;

    return (str.length > n) ? str.substr(0,n).trim() + "..." : str;
}

// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function replaceAll(str:string, find:string, replace:string):string {
    const re = new RegExp(escapeRegExp(find), 'g');
    return str.replace(re, replace);
}

export function formatDate(template:string, date:Date):string {
    let str = template;

    // date
    str = replaceAll(str, "$d", date.getDate()+"");
    str = replaceAll(str, "$M", (date.getMonth()+1)+"");
    str = replaceAll(str, "$y", date.getFullYear()+"");
    
    // time
    str = replaceAll(str, "$H", date.getHours()+"");
    str = replaceAll(str, "$h", ((date.getHours() + 24) % 12 || 12)+"");
    str = replaceAll(str, "$m", nDigitNum(2, date.getMinutes()));
    str = replaceAll(str, "$s", nDigitNum(2, date.getSeconds()));
    str = replaceAll(str, "$p", date.getHours() < 12 ? "a.m." : "p.m.");

    return str;
}

function nDigitNum(n:number, num:number):string {
    let str = ""+num;
    return str.length < n ? "0".repeat(n-str.length)+str : str;
}
