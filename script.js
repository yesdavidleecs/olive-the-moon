document.addEventListener('DOMContentLoaded', function() {
    // Password protection
    const PASSWORD = 'loveyou'; // Change this to your desired password
    
    const loginContainer = document.getElementById('loginContainer');
    const mainContent = document.getElementById('mainContent');
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('passwordInput');
    const errorMessage = document.getElementById('errorMessage');
    
    // Handle login
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (passwordInput.value === PASSWORD) {
            // Correct password - show main content
            loginContainer.classList.add('hidden');
            mainContent.classList.remove('hidden');
            
            // Clear the password field
            passwordInput.value = '';
            errorMessage.classList.add('hidden');
        } else {
            // Wrong password - show error
            errorMessage.classList.remove('hidden');
            passwordInput.value = '';
            
            // Add shake animation to input
            passwordInput.style.animation = 'shake 0.5s ease';
            setTimeout(() => {
                passwordInput.style.animation = '';
            }, 500);
        }
    });
    
    // Original envelope and letter functionality
    const envelope = document.getElementById('envelope');
    const letter = document.getElementById('letter');
    const confettiContainer = document.getElementById('confetti');
    let hasOpened = false;

    envelope.addEventListener('click', function() {
        if (!hasOpened) {
            // Open envelope
            envelope.classList.add('open');
            
            // Show letter after delay
            setTimeout(() => {
                letter.classList.remove('hidden');
                setTimeout(() => {
                    letter.classList.add('show');
                    // Trigger confetti
                    createConfetti();
                }, 50);
            }, 500);
            
            hasOpened = true;
            
            // Hide envelope after opening
            setTimeout(() => {
                envelope.style.display = 'none';
            }, 1000);
        }
    });

    function createConfetti() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6ab04c', '#c7ecee', '#dfe6e9', '#ff7979'];
        const confettiCount = 50;

        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.classList.add('confetti');
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';
                
                // Random shape (square or rectangle)
                if (Math.random() > 0.5) {
                    confetti.style.width = '8px';
                    confetti.style.height = '12px';
                } else {
                    confetti.style.width = '10px';
                    confetti.style.height = '10px';
                    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
                }
                
                confettiContainer.appendChild(confetti);
                
                // Remove confetti after animation
                setTimeout(() => {
                    confetti.remove();
                }, 5000);
            }, i * 50);
        }
    }

    // Add floating hearts animation
    const heartsInLetter = document.querySelectorAll('.heart');
    heartsInLetter.forEach((heart, index) => {
        heart.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.3) rotate(10deg)';
        });
        
        heart.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0deg)';
        });
    });

    // Add sparkle effect on hover for the title
    const title = document.querySelector('.title');
    if (title) {
        title.addEventListener('mouseenter', function() {
            this.style.textShadow = '2px 2px 20px rgba(118, 75, 162, 0.5)';
        });
        
        title.addEventListener('mouseleave', function() {
            this.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.1)';
        });
    }
});