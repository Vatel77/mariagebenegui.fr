document.addEventListener('DOMContentLoaded', () => {

    // Authentication Logic
    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const loginUser = document.getElementById('login-user');
    const loginPass = document.getElementById('login-pass');
    const loginError = document.getElementById('login-error');

    // Hardcoded credentials (server logic replacement)
    const AUTH_USER = 'BeneGui2026';
    const AUTH_PASS = 'Amour2026';

    // Check if already logged in
    if (localStorage.getItem('isLoggedIn') === 'true') {
        if (loginOverlay) loginOverlay.classList.add('hidden');
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = loginUser.value;
            const pass = loginPass.value;

            if (user === AUTH_USER && pass === AUTH_PASS) {
                localStorage.setItem('isLoggedIn', 'true');
                loginOverlay.classList.add('hidden');
            } else {
                loginError.textContent = 'Identifiants incorrects';
                loginForm.reset();
            }
        });
    }

    // Intersection Observer for Fade-in Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => {
        observer.observe(el);
    });

    // Guestbook Form Handler
    const form = document.getElementById('guestbook-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);

            const feedback = document.getElementById('form-feedback');
            feedback.textContent = 'Envoi en cours...';
            feedback.style.color = 'var(--text-color)';

            try {
                const response = await fetch('https://formspree.io/f/mlgjqnvw', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                const result = await response.json();

                if (response.ok) {
                    feedback.textContent = 'Merci ! Votre message a bien été envoyé.';
                    feedback.style.color = 'green';
                    form.reset();
                } else {
                    feedback.textContent = 'Oups ! Il y a eu un problème lors de l\'envoi du formulaire.';
                    if (result.errors) {
                        feedback.textContent += ' (' + result.errors.map(error => error.message).join(', ') + ')';
                    }
                    feedback.style.color = 'red';
                }
            } catch (error) {
                console.error('Error:', error);
                feedback.textContent = 'Erreur de connexion au service d\'envoi.';
                feedback.style.color = 'red';
            }
        });
    }

    // Photo Upload Handler (Disabled for Static Deployment)
    // GitHub Pages cannot host a Node.js server for file uploads.
    // The UI is updated to reflect that an external service should be used.
    const uploadSection = document.getElementById('phototheque');
    if (uploadSection) {
        // Optional: you can dynamically replace the content here or let the HTML change handle it.
        // For now, we will leave the JS clean and handle the UI update in HTML to remove the upload forms.
    }
});
