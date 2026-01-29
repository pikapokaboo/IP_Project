const disclaimer = document.getElementById("disclaimer");
const logo1 = document.getElementById("logo1");
const logo2 = document.getElementById("logo2");
const login = document.getElementById("loginScreen");

function show(el) {
    el.classList.add("show");
    el.classList.remove("hide");
}

function hide(el) {
    el.classList.add("hide");
    el.classList.remove("show");
}

// SEQUENCE
setTimeout(() => {
    show(disclaimer);
}, 500);

setTimeout(() => {
    hide(disclaimer);
}, 4500);

setTimeout(() => {
    show(logo1);
}, 6000);

setTimeout(() => {
    hide(logo1);
}, 10000);

setTimeout(() => {
    show(logo2);
}, 11500);

setTimeout(() => {
    logo2.classList.add("move-up");
}, 15500);

setTimeout(() => {
    show(login);
}, 16500);
