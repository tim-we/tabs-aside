let whitespaceBetweenTags:RegExp = /\>\s+\</g;

export function clean(html:string):string {
    return html.replace(whitespaceBetweenTags, "><").trim();
}