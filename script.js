document.addEventListener('DOMContentLoaded', function() {
    // Password protection
    const PASSWORD = 'iloveyou'; // Change this to your desired password
    
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
            
            // Load coupons after login
            loadCoupons();
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
    
    // Navigation functionality
    const navLinks = document.querySelectorAll('.nav-link');
    const homePage = document.getElementById('homePage');
    const couponsPage = document.getElementById('couponsPage');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show/hide pages based on data-page attribute
            const page = this.getAttribute('data-page');
            
            if (page === 'home') {
                homePage.classList.remove('hidden');
                couponsPage.classList.add('hidden');
            } else if (page === 'coupons') {
                homePage.classList.add('hidden');
                couponsPage.classList.remove('hidden');
            }
        });
    });
    
    // Load coupon images
    function loadCoupons() {
        const couponsGrid = document.getElementById('couponsGrid');
        const noCoupons = document.getElementById('noCoupons');
        
        // List of coupon images - you'll need to update this with actual filenames
        // For GitHub Pages, these will be relative paths to images in the coupons folder
        const couponImages = [
            // Add your coupon image filenames here, for example:
            // 'coupons/massage-coupon.jpg',
            // 'coupons/dinner-date.jpg',
            // 'coupons/movie-night.jpg',
        ];
        
        if (couponImages.length === 0) {
            // Show message if no coupons
            noCoupons.classList.remove('hidden');
        } else {
            // Hide no coupons message
            noCoupons.classList.add('hidden');
            
            // Clear grid and add coupon cards
            couponsGrid.innerHTML = '';
            
            couponImages.forEach((imagePath, index) => {
                const fileName = imagePath.split('/').pop();
                const couponName = fileName.replace(/\.[^/.]+$/, '').replace(/-/g, ' ');
                
                const couponCard = document.createElement('div');
                couponCard.className = 'coupon-card';
                couponCard.innerHTML = `
                    <img src="${imagePath}" alt="${couponName}" onerror="this.style.display='none'">
                    <div class="coupon-card-title">${formatCouponName(couponName)}</div>
                `;
                
                // Add click handler to navigate to coupon detail page
                couponCard.addEventListener('click', function() {
                    window.location.href = `coupon.html?name=${fileName}&amount=15000`;
                });
                
                couponsGrid.appendChild(couponCard);
            });
        }
        
        // Also check for dynamically loaded images from the coupons directory
        // This is a placeholder for when you add actual images
        checkForLocalImages();
    }
    
    function formatCouponName(name) {
        return name.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    function checkForLocalImages() {
        // Try to load images from the coupons directory
        // Special coupons configuration
        const specialCoupons = {
            'coupon.jpg': { type: 'monetary', amount: 15000 },
            'massage-coupon.jpg': { type: 'usage', couponType: 'massage' },
            'breakfast-in-bed.jpg': { type: 'usage', couponType: 'breakfast' },
            'argument-loss.jpg': { type: 'usage', couponType: 'argument' }
        };
        
        // All possible images to check
        const possibleImages = Object.keys(specialCoupons);
        
        const couponsGrid = document.getElementById('couponsGrid');
        const noCoupons = document.getElementById('noCoupons');
        
        possibleImages.forEach(imageName => {
            const img = new Image();
            img.onload = function() {
                // Image exists, add it to the grid
                if (couponsGrid.children.length === 0 || 
                    !Array.from(couponsGrid.children).some(child => 
                        child.querySelector('img')?.src.includes(imageName))) {
                    
                    noCoupons.classList.add('hidden');
                    
                    const couponName = imageName.replace(/\.[^/.]+$/, '').replace(/-/g, ' ');
                    const couponCard = document.createElement('div');
                    couponCard.className = 'coupon-card';
                    
                    // Get display name for the coupon
                    let displayName = couponName;
                    if (imageName === 'argument-loss.jpg') {
                        displayName = 'Argument Loss Coupon';
                    } else if (imageName === 'massage-coupon.jpg') {
                        displayName = 'Massage Coupon';
                    } else if (imageName === 'breakfast-in-bed.jpg') {
                        displayName = 'Breakfast in Bed';
                    } else {
                        displayName = formatCouponName(couponName);
                    }
                    
                    couponCard.innerHTML = `
                        <img src="coupons/${imageName}" alt="${displayName}">
                        <div class="coupon-card-title">${displayName}</div>
                    `;
                    
                    // Add click handler based on coupon type
                    const couponConfig = specialCoupons[imageName];
                    couponCard.addEventListener('click', function() {
                        if (couponConfig && couponConfig.type === 'usage') {
                            // Navigate to usage-based coupon page
                            window.location.href = `coupon-usage.html?type=${couponConfig.couponType}`;
                        } else {
                            // Navigate to monetary coupon page
                            window.location.href = `coupon.html?name=${imageName}&amount=${couponConfig?.amount || 15000}`;
                        }
                    });
                    
                    couponsGrid.appendChild(couponCard);
                }
            };
            img.onerror = function() {
                // Image doesn't exist, do nothing
            };
            img.src = `coupons/${imageName}`;
        });
    }
    
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