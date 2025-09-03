document.addEventListener('DOMContentLoaded', async function() {
    // Include authentication utilities
    const script = document.createElement('script');
    script.src = 'auth-utils.js';
    document.head.appendChild(script);
    
    script.onload = function() {
        // Wait for auth manager to be ready
        setTimeout(initApp, 100);
    };
    
    async function initApp() {
        const loginContainer = document.getElementById('loginContainer');
        const mainContent = document.getElementById('mainContent');
        const loginForm = document.getElementById('loginForm');
        const passwordInput = document.getElementById('passwordInput');
        const errorMessage = document.getElementById('errorMessage');
        
        // Get coupon type from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const couponType = urlParams.get('type') || 'special';
        
        // Define coupon configurations
        const couponConfigs = {
            'massage': {
                title: 'Massage Coupon',
                message: 'This coupon entitles you to one relaxing massage session, redeemable at any time!',
                initialUses: 1
            },
            'breakfast': {
                title: 'Breakfast in Bed Coupon',
                message: 'This coupon entitles you to one delicious breakfast served in bed with love!',
                initialUses: 1
            },
            'argument': {
                title: 'Argument Loss Coupon',
                message: 'This coupon allows you to win one argument automatically. Use wisely!',
                initialUses: 1
            },
            'special': {
                title: 'Special Treat Coupon',
                message: 'This coupon entitles you to one special treat of your choice!',
                initialUses: 1
            }
        };
        
        // Get configuration for this coupon type
        const config = couponConfigs[couponType] || couponConfigs['special'];
        
        // Update page content based on coupon type
        document.getElementById('couponTitle').textContent = config.title;
        document.getElementById('couponMessage').innerHTML = `
            <p>${config.message}</p>
            <p class="no-expiration">No expiration date ♥</p>
        `;
        
        // Initialize usage count
        let currentUsage = config.initialUses;
        let couponData = null;
        
        // Storage keys
        const storageKey = `usage_coupon_${couponType}_uses`;
        const historyKey = `usage_coupon_${couponType}_history`;
        
        // Load coupon data
        async function loadCouponData() {
            console.log('========================================');
            console.log('🎟️ Loading usage coupon:', couponType);
            
            try {
                // Try Firebase first
                console.log('📡 Attempting to load from Firebase...');
                const doc = await db.collection('usage-coupons').doc(couponType).get();
                
                if (doc.exists) {
                    couponData = doc.data();
                    currentUsage = couponData.usesRemaining !== undefined ? couponData.usesRemaining : config.initialUses;
                    console.log('✅ Loaded from Firebase. Uses remaining:', currentUsage);
                } else {
                    // Initialize new coupon in Firebase
                    console.log('🆕 Creating new coupon in Firebase...');
                    couponData = {
                        usesRemaining: config.initialUses,
                        history: [],
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    await db.collection('usage-coupons').doc(couponType).set(couponData);
                    currentUsage = config.initialUses;
                    console.log('✅ New coupon created in Firebase');
                }
            } catch (error) {
                console.error('❌ Firebase error:', error.message);
                console.warn('⚠️ FALLBACK: Using localStorage');
                
                // Fallback to localStorage
                const storedUses = localStorage.getItem(storageKey);
                currentUsage = storedUses !== null ? parseInt(storedUses) : config.initialUses;
                
                const storedHistory = localStorage.getItem(historyKey);
                couponData = {
                    usesRemaining: currentUsage,
                    history: storedHistory ? JSON.parse(storedHistory) : []
                };
                
                console.log('💾 Loaded from localStorage. Uses remaining:', currentUsage);
            }
            
            // Update display
            updateDisplay();
            
            // Load history
            if (couponData.history && couponData.history.length > 0) {
                displayHistory(couponData.history);
            }
            
            console.log('========================================');
        }
        
        // Update display based on current usage
        function updateDisplay() {
            document.getElementById('usageCount').textContent = currentUsage;
            document.getElementById('currentUsage').textContent = currentUsage;
            document.getElementById('redeemAmount').max = currentUsage;
            
            if (currentUsage === 0) {
                // Show fully redeemed state
                document.getElementById('activeRedemption').classList.add('hidden');
                document.getElementById('fullyRedeemed').classList.remove('hidden');
                document.getElementById('usageCount').classList.add('usage-depleted');
            } else {
                // Show active redemption state
                document.getElementById('activeRedemption').classList.remove('hidden');
                document.getElementById('fullyRedeemed').classList.add('hidden');
                document.getElementById('usageCount').classList.remove('usage-depleted');
            }
        }
        
        // Check if user is already authenticated
        if (authManager.isAuthenticated) {
            console.log('✅ User already authenticated, showing usage coupon');
            loginContainer.classList.add('hidden');
            mainContent.classList.remove('hidden');
            await loadCouponData();
            return;
        }
        
        // Handle login
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (authManager.validatePassword(passwordInput.value)) {
                // Correct password - create session and show main content
                authManager.createSession();
                loginContainer.classList.add('hidden');
                mainContent.classList.remove('hidden');
                passwordInput.value = '';
                errorMessage.classList.add('hidden');
                
                // Load coupon data after login
                await loadCouponData();
            } else {
                errorMessage.classList.remove('hidden');
                passwordInput.value = '';
                passwordInput.style.animation = 'shake 0.5s ease';
                setTimeout(() => {
                    passwordInput.style.animation = '';
                }, 500);
            }
        });
        
        // Handle redemption
        const redemptionForm = document.getElementById('redemptionForm');
        const redeemAmount = document.getElementById('redeemAmount');
        const redemptionMessage = document.getElementById('redemptionMessage');
        
        redemptionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const usesToRedeem = parseInt(redeemAmount.value);
            
            // Validation
            if (isNaN(usesToRedeem) || usesToRedeem <= 0) {
                showMessage('Please enter a valid number', 'error');
                return;
            }
            
            if (usesToRedeem > currentUsage) {
                showMessage(`You only have ${currentUsage} use(s) remaining!`, 'error');
                return;
            }
            
            // Process redemption
            currentUsage -= usesToRedeem;
            
            // Create history entry
            const now = new Date();
            const historyEntry = {
                usesRedeemed: usesToRedeem,
                date: now.toLocaleDateString(),
                time: now.toLocaleTimeString(),
                usesRemaining: currentUsage,
                timestamp: now.toISOString()
            };
            
            // Save to storage
            try {
                // Try Firebase first
                console.log('🔄 Updating usage in Firebase...');
                await db.collection('usage-coupons').doc(couponType).update({
                    usesRemaining: currentUsage,
                    history: firebase.firestore.FieldValue.arrayUnion(historyEntry),
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('✅ Firebase updated successfully');
            } catch (error) {
                console.error('❌ Firebase update error:', error.message);
                console.log('💾 Saving to localStorage instead');
            }
            
            // Always save to localStorage as backup
            localStorage.setItem(storageKey, currentUsage.toString());
            const localHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
            localHistory.push(historyEntry);
            localStorage.setItem(historyKey, JSON.stringify(localHistory));
            
            // Update display
            updateDisplay();
            
            // Update history display
            if (!couponData.history) couponData.history = [];
            couponData.history.push(historyEntry);
            displayHistory(couponData.history);
            
            // Show success message
            if (currentUsage === 0) {
                showMessage(`Coupon redeemed! This coupon has been fully used. Enjoy! ♥`, 'success');
            } else {
                showMessage(`Successfully redeemed! ${currentUsage} use(s) remaining.`, 'success');
            }
            
            // Reset form
            redeemAmount.value = '1';
        });
        
        function showMessage(message, type) {
            redemptionMessage.textContent = message;
            redemptionMessage.className = 'redemption-message ' + type;
            redemptionMessage.classList.remove('hidden');
            
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
                    li.textContent = `Used ${entry.usesRedeemed} time(s) on ${entry.date} at ${entry.time} (${entry.usesRemaining} remaining)`;
                    historyList.appendChild(li);
                });
            }
        }
        
        // Reset function (available via button or Ctrl+Shift+R)
        window.resetCoupon = async function() {
            if (confirm('Reset this coupon to its original state?')) {
                currentUsage = config.initialUses;
                
                try {
                    // Reset in Firebase
                    await db.collection('usage-coupons').doc(couponType).set({
                        usesRemaining: config.initialUses,
                        history: [],
                        resetAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    console.log('✅ Coupon reset in Firebase');
                } catch (error) {
                    console.error('❌ Firebase reset error:', error.message);
                }
                
                // Reset localStorage
                localStorage.removeItem(storageKey);
                localStorage.removeItem(historyKey);
                
                // Reset display
                couponData = { usesRemaining: config.initialUses, history: [] };
                updateDisplay();
                document.getElementById('redemptionHistory').classList.add('hidden');
                
                showMessage('Coupon has been reset!', 'success');
            }
        };
        
        // Keyboard shortcut for reset
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                window.resetCoupon();
            }
        });
    }
});