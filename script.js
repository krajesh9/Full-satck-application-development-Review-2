// Add subtle scroll effect to navigation
const nav = document.querySelector('.glass-nav');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        nav.style.background = 'rgba(7, 7, 20, 0.85)';
        nav.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.5)';
    } else {
        nav.style.background = 'rgba(7, 7, 20, 0.7)';
        nav.style.boxShadow = 'none';
    }
});

// Animate elements on scroll logic
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Select specific elements to animate
const animatedElements = document.querySelectorAll('.feature-card, .dashboard-mockup, .dashboard-text, .cta-box');

animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)';
    observer.observe(el);
});

// Mock interactive buttons
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        window.location.href = 'login.html';
    });
}

// Simulate AI processing progress on the skill bars over time just for a visual wow-effect
setTimeout(() => {
    const bars = document.querySelectorAll('.progress-fill');
    if(bars.length >= 2) {
        // Expand the progress visually after load
        bars[0].style.width = '35%';
        bars[0].style.transition = 'width 2s ease-in-out';
        
        bars[1].style.width = '75%';
        bars[1].style.transition = 'width 2.5s ease-in-out';
    }
}, 1000);
