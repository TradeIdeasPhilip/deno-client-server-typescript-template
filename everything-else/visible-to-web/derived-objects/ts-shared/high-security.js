import { rot13 } from "./useful-stuff";
export function tripleRot13(str) {
    return rot13(rot13(rot13(str)));
}
//# sourceMappingURL=high-security.js.map