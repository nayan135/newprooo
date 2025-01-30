document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const shortId = urlParams.get('shortId');

    if (shortId) {
        try {
            const response = await fetch(`/get-name?shortId=${shortId}`);
            const data = await response.json();
            if (data.name) {
                document.getElementById('main').style.display = 'none';
                document.getElementById('container').style.display = 'block';
                document.getElementById('user-name').textContent = data.name;
            }
        } catch (err) {
            console.error('Error fetching name:', err);
        }
    }

    const form = document.getElementById('user-form');
    const linkContainer = document.getElementById('link-container');
    const generatedLink = document.getElementById('generated-link');
    const copyButton = document.getElementById('copy-button');

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;

        try {
            const response = await fetch('/submit-name', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email })
            });
            const data = await response.json();
            if (data.shortId) {
                const link = `${window.location.origin}/main?shortId=${data.shortId}`;
                generatedLink.value = link;
                linkContainer.style.display = 'block';
            }
        } catch (err) {
            console.error('Error submitting form:', err);
        }
    });

    copyButton.addEventListener('click', function () {
        generatedLink.select();
        document.execCommand('copy');
        alert('Link copied to clipboard');
    });

    const button = document.getElementById('button');
    const container = document.getElementById('container');
    const reveal = document.getElementById('reveal');
    const rose = document.getElementById('rose');
    const paths = rose.querySelectorAll('path');

    button.addEventListener('click', function () {
        container.style.display = 'none';
        reveal.style.display = 'flex';
        animateRose();
    });

    function animateRose() {
        paths.forEach((path, index) => {
            path.style.opacity = 0;
            path.style.transform = 'translateY(20px)';
            path.style.animation = `grow 2s ease-in-out forwards ${index * 0.2}s`;
        });
    }
});