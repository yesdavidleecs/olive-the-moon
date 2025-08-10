document.addEventListener('DOMContentLoaded', function() {
    // Password protection
    const PASSWORD = 'loveyou'; // Same password as main page
    
    const loginContainer = document.getElementById('loginContainer');
    const mainContent = document.getElementById('mainContent');
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('passwordInput');
    const errorMessage = document.getElementById('errorMessage');
    
    // Get coupon name from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const couponName = urlParams.get('name') || 'coupon';
    const initialAmount = parseInt(urlParams.get('amount')) || 15000;
    
    // Initialize coupon amount from localStorage or default
    const storageKey = `coupon_${couponName}_balance`;
    const historyKey = `coupon_${couponName}_history`;
    let currentBalance = localStorage.getItem(storageKey) ? 
        parseInt(localStorage.getItem(storageKey)) : initialAmount;
    
    // Update initial display
    document.getElementById('couponAmount').textContent = currentBalance;
    document.getElementById('currentBalance').textContent = currentBalance;
    
    // Load and display coupon image if available
    const imageContainer = document.getElementById('couponImageContainer');
    if (couponName) {
        const img = document.createElement('img');
        img.src = `coupons/${couponName}`;
        img.alt = 'Coupon Image';
        img.onerror = function() {
            // Hide image container if image doesn't load
            imageContainer.style.display = 'none';
        };
        imageContainer.appendChild(img);
    }
    
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
            
            // Load redemption history
            loadHistory();
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
    
    // Handle redemption form
    const redemptionForm = document.getElementById('redemptionForm');
    const redeemAmount = document.getElementById('redeemAmount');
    const redemptionMessage = document.getElementById('redemptionMessage');
    
    redemptionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const amount = parseInt(redeemAmount.value);
        
        // Validation
        if (isNaN(amount) || amount <= 0) {
            showMessage('Please enter a valid positive number', 'error');
            return;
        }
        
        if (!Number.isInteger(amount)) {
            showMessage('Please enter a whole number (no decimals)', 'error');
            return;
        }
        
        if (amount > currentBalance) {
            showMessage(`Insufficient balance! You can only redeem up to $${currentBalance}`, 'error');
            return;
        }
        
        // Process redemption
        currentBalance -= amount;
        
        // Update display
        document.getElementById('couponAmount').textContent = currentBalance;
        document.getElementById('currentBalance').textContent = currentBalance;
        
        // Save to localStorage
        localStorage.setItem(storageKey, currentBalance.toString());
        
        // Add to history
        addToHistory(amount);
        
        // Show success message
        if (currentBalance === 0) {
            showMessage(`Successfully redeemed $${amount}! Your coupon has been fully used. Thank you! ♥`, 'success');
        } else {
            showMessage(`Successfully redeemed $${amount}! Remaining balance: $${currentBalance}`, 'success');
        }
        
        // Clear form
        redeemAmount.value = '';
        
        // Load updated history
        loadHistory();
    });
    
    function showMessage(message, type) {
        redemptionMessage.textContent = message;
        redemptionMessage.className = 'redemption-message ' + type;
        redemptionMessage.classList.remove('hidden');
        
        // Hide message after 5 seconds
        setTimeout(() => {
            redemptionMessage.classList.add('hidden');
        }, 5000);
    }
    
    function addToHistory(amount) {
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        const now = new Date();
        history.push({
            amount: amount,
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString(),
            balance: currentBalance
        });
        localStorage.setItem(historyKey, JSON.stringify(history));
    }
    
    function loadHistory() {
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        const historyContainer = document.getElementById('redemptionHistory');
        const historyList = document.getElementById('historyList');
        
        if (history.length > 0) {
            historyContainer.classList.remove('hidden');
            historyList.innerHTML = '';
            
            // Show history in reverse order (most recent first)
            history.reverse().forEach(entry => {
                const li = document.createElement('li');
                li.textContent = `Redeemed $${entry.amount} on ${entry.date} at ${entry.time} (Balance: $${entry.balance})`;
                historyList.appendChild(li);
            });
        }
    }
    
    // Allow resetting balance with special key combination (Ctrl+Shift+R)
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            if (confirm('Reset coupon balance to original amount?')) {
                currentBalance = initialAmount;
                localStorage.setItem(storageKey, currentBalance.toString());
                localStorage.removeItem(historyKey);
                document.getElementById('couponAmount').textContent = currentBalance;
                document.getElementById('currentBalance').textContent = currentBalance;
                document.getElementById('redemptionHistory').classList.add('hidden');
                showMessage('Coupon balance has been reset!', 'success');
            }
        }
    });
});