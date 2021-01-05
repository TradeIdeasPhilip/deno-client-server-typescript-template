export var copyrightString = "© Trade-Ideas, LLC 2021";
export function rot13(str) {
    return (str + '').replace(/[a-zA-Z]/gi, function (s) {
        return String.fromCharCode(s.charCodeAt(0) + (s.toLowerCase() < 'n' ? 13 : -13));
    });
}
//# sourceMappingURL=useful-stuff.js.map