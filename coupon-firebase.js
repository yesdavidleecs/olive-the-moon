document.addEventListener('DOMContentLoaded', async function() {
    // Password protection
    const PASSWORD = 'iloveyou'; // Same password as main page
    
    const loginContainer = document.getElementById('loginContainer');
    const mainContent = document.getElementById('mainContent');
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('passwordInput');
    const errorMessage = document.getElementById('errorMessage');
    
    // Get coupon name from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const couponName = urlParams.get('name') || 'coupon';
    const initialAmount = parseInt(urlParams.get('amount')) || 15000;
    
    // Initialize current balance
    let currentBalance = initialAmount;
    let couponData = null;
    
    // Load coupon data from Firebase
    async function loadCouponData() {
        console.log('========================================');
        console.log('🚀 Starting to load coupon data...');
        console.log('Coupon name:', couponName);
        try {
            couponData = await CouponStorage.getCoupon(couponName);
            currentBalance = couponData.balance || initialAmount;
            
            // Update display
            document.getElementById('couponAmount').textContent = currentBalance;
            document.getElementById('currentBalance').textContent = currentBalance;
            
            // Load history
            if (couponData.history && couponData.history.length > 0) {
                displayHistory(couponData.history);
            }
            console.log('✨ Coupon data loaded successfully!');
            console.log('Current balance:', currentBalance);
            console.log('========================================');
        } catch (error) {
            console.error("❌ Critical error loading coupon data:", error);
            console.warn('⚠️ Using localStorage fallback for entire load operation');
            // Fallback to localStorage values if they exist
            currentBalance = parseInt(localStorage.getItem(`coupon_${couponName}_balance`) || initialAmount.toString());
            document.getElementById('couponAmount').textContent = currentBalance;
            document.getElementById('currentBalance').textContent = currentBalance;
            console.log('💾 Loaded from localStorage. Balance:', currentBalance);
            console.log('========================================');
        }
    }
    
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
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (passwordInput.value === PASSWORD) {
            // Correct password - show main content
            loginContainer.classList.add('hidden');
            mainContent.classList.remove('hidden');
            
            // Clear the password field
            passwordInput.value = '';
            errorMessage.classList.add('hidden');
            
            // Load coupon data from Firebase
            await loadCouponData();
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
    
    redemptionForm.addEventListener('submit', async function(e) {
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
        
        // Create history entry
        const now = new Date();
        const historyEntry = {
            amount: amount,
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString(),
            balance: currentBalance,
            timestamp: now.toISOString()
        };
        
        // Save to Firebase and localStorage
        try {
            // Update balance
            await CouponStorage.updateBalance(couponName, currentBalance);
            
            // Add to history
            await CouponStorage.addToHistory(couponName, historyEntry);
            
            // Reload history display
            const updatedData = await CouponStorage.getCoupon(couponName);
            if (updatedData.history) {
                displayHistory(updatedData.history);
            }
            
            // Show success message
            if (currentBalance === 0) {
                showMessage(`Successfully redeemed $${amount}! Your coupon has been fully used. Thank you! ♥`, 'success');
            } else {
                showMessage(`Successfully redeemed $${amount}! Remaining balance: $${currentBalance}`, 'success');
            }
        } catch (error) {
            console.error("Error saving redemption:", error);
            showMessage(`Redeemed $${amount} (saved locally). Balance: $${currentBalance}`, 'success');
        }
        
        // Clear form
        redeemAmount.value = '';
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
    
    function displayHistory(history) {
        const historyContainer = document.getElementById('redemptionHistory');
        const historyList = document.getElementById('historyList');
        
        if (history && history.length > 0) {
            historyContainer.classList.remove('hidden');
            historyList.innerHTML = '';
            
            // Sort by timestamp (most recent first)
            const sortedHistory = [...history].sort((a, b) => {
                const timeA = a.timestamp ? new Date(a.timestamp) : new Date(`${a.date} ${a.time}`);
                const timeB = b.timestamp ? new Date(b.timestamp) : new Date(`${b.date} ${b.time}`);
                return timeB - timeA;
            });
            
            sortedHistory.forEach(entry => {
                const li = document.createElement('li');
                li.textContent = `Redeemed $${entry.amount} on ${entry.date} at ${entry.time} (Balance: $${entry.balance})`;
                historyList.appendChild(li);
            });
        }
    }
    
    // Allow resetting balance with special key combination (Ctrl+Shift+R)
    document.addEventListener('keydown', async function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            if (confirm('Reset coupon balance to original amount?')) {
                try {
                    await CouponStorage.resetCoupon(couponName, initialAmount);
                    currentBalance = initialAmount;
                    document.getElementById('couponAmount').textContent = currentBalance;
                    document.getElementById('currentBalance').textContent = currentBalance;
                    document.getElementById('redemptionHistory').classList.add('hidden');
                    showMessage('Coupon balance has been reset!', 'success');
                } catch (error) {
                    console.error("Error resetting coupon:", error);
                    showMessage('Error resetting coupon. Please try again.', 'error');
                }
            }
        }
    });
});