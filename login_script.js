const navbarMenu = document.querySelector(".navbar .links");
const hamburgerBtn = document.querySelector(".hamburger-btn");
const hideMenuBtn = navbarMenu.querySelector(".close-btn");
const showPopupBtn = document.querySelector(".login-btn");
const formPopup = document.querySelector(".form-popup");
const hidePopupBtn = formPopup.querySelector(".close-btn");
const signupLoginLink = formPopup.querySelectorAll(".bottom-link a");

// Show mobile menu
hamburgerBtn.addEventListener("click", () => {
    navbarMenu.classList.toggle("show-menu");
});

// Hide mobile menu
hideMenuBtn.addEventListener("click", () => hamburgerBtn.click());

// Show login popup
const resetFormFields = () => {
    const form = formPopup.querySelector('form');
    if (form) {
        form.reset(); // Resets all fields in the form
    }
};

showPopupBtn.addEventListener("click", () => {
    resetFormFields(); // Reset fields before showing popup
    document.body.classList.toggle("show-popup");
});

// Hide login popup
hidePopupBtn.addEventListener("click", () => {
    document.body.classList.remove("show-popup");
});

// Show or hide signup form
signupLoginLink.forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        formPopup.classList[link.id === 'signup-link' ? 'add' : 'remove']("show-signup");
    });
});

// Handle login
document.querySelector('#login-btn').addEventListener('click', async () => {
    const username = document.querySelector('#username').value;
    const password = document.querySelector('#password').value;

    if (username && password) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                window.location.href = '/chat'; // Redirect to chatbot page
            } else {
                alert('Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('An error occurred during login. Please try again later.');
        }
    } else {
        alert('Please enter both username and password.');
    }
});








