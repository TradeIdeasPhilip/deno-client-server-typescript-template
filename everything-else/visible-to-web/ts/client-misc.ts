
/**
 * This is a wrapper around document.getElementById().
 * This ensures that we find the element and that it has the right type or it throws an exception.
 * Note that the return type of the function matches the requested type.
 * @param id Look for an element with this id.
 * @param ty This is the type we are expecting.  E.g. HtmlButtonElement
 */
export function getById<T extends Element>(id : string, ty: {new(): T}): T {
// https://stackoverflow.com/a/64780056/971955
const found = document.getElementById(id);
  if (!found) {
    throw new Error("Could not find element with id " + id + ".  Expected type:  " + ty.name);
  }
  if (found instanceof ty) {
    return found;
  } else {
      throw new Error("Element with id " + id + " has type " + found.constructor.name + ".  Expected type:  " + ty.name);
  }
}