const copyrightString = "© Trade-Ideas, LLC 2021";
function rot13(str) {
    return (str + '').replace(/[a-zA-Z]/gi, function(s) {
        return String.fromCharCode(s.charCodeAt(0) + (s.toLowerCase() < 'n' ? 13 : -13));
    });
}
function tripleRot13(str) {
    return rot13(rot13(rot13(str)));
}
function getById(id, ty) {
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
const nameInput = getById("name", HTMLInputElement);
const goButton = getById("go", HTMLButtonElement);
const answerP = getById("answer", HTMLParagraphElement);
const copyrightP = getById("copyright", HTMLParagraphElement);
goButton.addEventListener("click", async ()=>{
    const name = nameInput.value.trim();
    const encryptedName = tripleRot13(name);
    const response = await fetch("/js-bin/greet?encrypted_name=" + encodeURIComponent(encryptedName));
    const todisplay = await response.text();
    answerP.innerText = todisplay;
});
copyrightP.innerText = copyrightString;
