const disclaimer = document.getElementById("disclaimer");
const logo1 = document.getElementById("logo1");
const logo2 = document.getElementById("logo2");
const login = document.getElementById("loginScreen");
const signup = document.getElementById("signupScreen");

const goToSignup = document.getElementById("goToSignup");
const backToLogin = document.getElementById("backToLogin");

function show(el) {
  el.classList.add("show");
  el.classList.remove("hide");
}

function hide(el) {
  el.classList.add("hide");
  el.classList.remove("show");
}

// Make sure ONLY disclaimer is visible at first
hide(logo1);
hide(logo2);
hide(login);
hide(signup);
show(disclaimer);

// SEQUENCE
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
  hide(signup);
}, 16500);

// Switch to signup
goToSignup.addEventListener("click", () => {
  hide(login);
  show(signup);
});

// Back to login
backToLogin.addEventListener("click", () => {
  hide(signup);
  show(login);
});
