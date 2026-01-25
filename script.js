document.addEventListener('DOMContentLoaded', () => {

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
            const data = {
                name: formData.get('name'),
                message: formData.get('message')
            };

            const feedback = document.getElementById('form-feedback');
            feedback.textContent = 'Envoi en cours...';

            try {
                const response = await fetch('/api/guestbook', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    feedback.textContent = 'Merci ! Votre message a bien été enregistré.';
                    feedback.style.color = 'green';
                    form.reset();
                } else {
                    feedback.textContent = 'Erreur : ' + (result.error || 'Une erreur est survenue.');
                    feedback.style.color = 'red';
                }
            } catch (error) {
                console.error('Error:', error);
                feedback.textContent = 'Erreur de connexion au serveur.';
                feedback.style.color = 'red';
            }
        });
    }

    // Photo Upload Handler
    const fileInput = document.getElementById('file-upload');
    const folderInput = document.getElementById('folder-upload');
    const uploadBtn = document.getElementById('upload-btn');
    const fileCount = document.getElementById('file-count');
    const folderCount = document.getElementById('folder-count');
    const uploadFeedback = document.getElementById('upload-feedback');

    let filesToUpload = [];

    function updateFileList(e) {
        const newFiles = Array.from(e.target.files);
        if (newFiles.length > 0) {
            filesToUpload = newFiles; // Replace simple selection
            // For folder upload, we can append but usually replacing is less confusing for simple UX

            if (e.target.id === 'file-upload') {
                fileCount.textContent = `${newFiles.length} photo(s) sélectionnée(s)`;
                folderCount.textContent = 'Aucun dossier sélectionné';
                folderInput.value = ''; // Clear other input
            } else {
                folderCount.textContent = `${newFiles.length} fichier(s) dans le dossier`;
                fileCount.textContent = 'Aucun fichier sélectionné';
                fileInput.value = ''; // Clear other input
            }
            uploadBtn.style.display = 'inline-block';
        }
    }

    if (fileInput) fileInput.addEventListener('change', updateFileList);
    if (folderInput) folderInput.addEventListener('change', updateFileList);

    if (uploadBtn) {
        uploadBtn.addEventListener('click', async () => {
            if (filesToUpload.length === 0) return;

            uploadFeedback.textContent = 'Téléchargement en cours... Veuillez patienter.';
            uploadFeedback.style.color = 'var(--text-color)';
            uploadBtn.disabled = true;

            const formData = new FormData();
            filesToUpload.forEach(file => {
                formData.append('photos', file);
            });

            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    uploadFeedback.textContent = result.message;
                    uploadFeedback.style.color = 'green';
                    filesToUpload = [];
                    fileInput.value = '';
                    folderInput.value = '';
                    fileCount.textContent = 'Aucun fichier sélectionné';
                    folderCount.textContent = 'Aucun dossier sélectionné';
                    uploadBtn.style.display = 'none';
                    uploadBtn.disabled = false;
                } else {
                    throw new Error('Upload failed');
                }
            } catch (error) {
                console.error(error);
                uploadFeedback.textContent = 'Erreur lors du téléchargement. Vérifiez votre connexion.';
                uploadFeedback.style.color = 'red';
                uploadBtn.disabled = false;
            }
        });
    }
});
