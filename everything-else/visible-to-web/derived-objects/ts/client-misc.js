export function getById(id, ty) {
    var found = document.getElementById(id);
    if (!found) {
        throw new Error("Could not find element with id " + id + ".  Expected type:  " + ty.name);
    }
    if (found instanceof ty) {
        return found;
    }
    else {
        throw new Error("Element with id " + id + " has type " + found.constructor.name + ".  Expected type:  " + ty.name);
    }
}
//# sourceMappingURL=client-misc.js.map