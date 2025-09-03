document.addEventListener('DOMContentLoaded', async function() {
    // Password protection
    const PASSWORD = 'iloveyou'; // Same password as main page
    
    const loginContainer = document.getElementById('loginContainer');
    const mainContent = document.getElementById('mainContent');
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('passwordInput');
    const errorMessage = document.getElementById('errorMessage');
    
    // Get coupon type from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const couponType = urlParams.get('type') || 'workout';
    
    // Workout progress configuration
    const workoutConfig = {
        title: 'Workout Progress Coupon',
        message: 'Track your workout progress and earn rewards! Each workout session increases your streak and adds to your monetary value.',
        rewardPerWorkout: 100, // $100 per workout
        initialStreak: 0,
        initialMonetaryValue: 0,
        initialHighestStreak: 0
    };
    
    // Initialize workout progress data
    let currentStreak = workoutConfig.initialStreak;
    let monetaryValue = workoutConfig.initialMonetaryValue;
    let highestStreak = workoutConfig.initialHighestStreak;
    let workoutData = null;
    
    // Storage keys
    const storageKey = `workout_coupon_${couponType}_data`;
    
    // Load workout data
    async function loadWorkoutData() {
        console.log('========================================');
        console.log('🏋️ Loading workout progress coupon:', couponType);
        
        try {
            // Try Firebase first
            console.log('📡 Attempting to load from Firebase...');
            const doc = await db.collection('workout-coupons').doc(couponType).get();
            
            if (doc.exists) {
                workoutData = doc.data();
                currentStreak = workoutData.currentStreak !== undefined ? workoutData.currentStreak : workoutConfig.initialStreak;
                monetaryValue = workoutData.monetaryValue !== undefined ? workoutData.monetaryValue : workoutConfig.initialMonetaryValue;
                highestStreak = workoutData.highestStreak !== undefined ? workoutData.highestStreak : workoutConfig.initialHighestStreak;
                console.log('✅ Loaded from Firebase. Streak:', currentStreak, 'Monetary:', monetaryValue, 'Highest:', highestStreak);
            } else {
                // Initialize new workout coupon in Firebase
                console.log('🆕 Creating new workout coupon in Firebase...');
                workoutData = {
                    currentStreak: workoutConfig.initialStreak,
                    monetaryValue: workoutConfig.initialMonetaryValue,
                    highestStreak: workoutConfig.initialHighestStreak,
                    history: [],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                await db.collection('workout-coupons').doc(couponType).set(workoutData);
                currentStreak = workoutConfig.initialStreak;
                monetaryValue = workoutConfig.initialMonetaryValue;
                highestStreak = workoutConfig.initialHighestStreak;
                console.log('✅ New workout coupon created in Firebase');
            }
        } catch (error) {
            console.error('❌ Firebase error:', error.message);
            console.warn('⚠️ FALLBACK: Using localStorage');
            
            // Fallback to localStorage
            const storedData = localStorage.getItem(storageKey);
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                currentStreak = parsedData.currentStreak || workoutConfig.initialStreak;
                monetaryValue = parsedData.monetaryValue || workoutConfig.initialMonetaryValue;
                highestStreak = parsedData.highestStreak || workoutConfig.initialHighestStreak;
                workoutData = {
                    currentStreak: currentStreak,
                    monetaryValue: monetaryValue,
                    highestStreak: highestStreak,
                    history: parsedData.history || []
                };
            } else {
                workoutData = {
                    currentStreak: workoutConfig.initialStreak,
                    monetaryValue: workoutConfig.initialMonetaryValue,
                    highestStreak: workoutConfig.initialHighestStreak,
                    history: []
                };
            }
            
            console.log('💾 Loaded from localStorage. Streak:', currentStreak, 'Monetary:', monetaryValue, 'Highest:', highestStreak);
        }
        
        // Update display
        updateDisplay();
        
        // Load history
        if (workoutData.history && workoutData.history.length > 0) {
            displayHistory(workoutData.history);
        }
        
        console.log('========================================');
    }
    
    // Update display based on current workout progress
    function updateDisplay() {
        document.getElementById('currentStreak').textContent = currentStreak;
        document.getElementById('highestStreak').textContent = highestStreak;
        document.getElementById('monetaryValue').textContent = `$${monetaryValue.toLocaleString()}`;
        document.getElementById('rewardAmount').textContent = `$${workoutConfig.rewardPerWorkout.toLocaleString()}`;
    }
    
    // Handle login
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (passwordInput.value === PASSWORD) {
            loginContainer.classList.add('hidden');
            mainContent.classList.remove('hidden');
            passwordInput.value = '';
            errorMessage.classList.add('hidden');
            
            // Load workout data after login
            await loadWorkoutData();
        } else {
            errorMessage.classList.remove('hidden');
            passwordInput.value = '';
            passwordInput.style.animation = 'shake 0.5s ease';
            setTimeout(() => {
                passwordInput.style.animation = '';
            }, 500);
        }
    });
    
    // Handle increment button (complete workout)
    const incrementButton = document.getElementById('incrementButton');
    incrementButton.addEventListener('click', async function() {
        // Increment streak
        currentStreak++;
        
        // Add reward to monetary value
        monetaryValue += workoutConfig.rewardPerWorkout;
        
        // Update highest streak if current is higher
        if (currentStreak > highestStreak) {
            highestStreak = currentStreak;
        }
        
        // Create history entry
        const now = new Date();
        const historyEntry = {
            action: 'workout_completed',
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString(),
            streakAfter: currentStreak,
            monetaryValueAfter: monetaryValue,
            highestStreakAfter: highestStreak,
            rewardEarned: workoutConfig.rewardPerWorkout,
            timestamp: now.toISOString()
        };
        
        // Save to storage
        try {
            // Try Firebase first
            console.log('🔄 Updating workout progress in Firebase...');
            await db.collection('workout-coupons').doc(couponType).update({
                currentStreak: currentStreak,
                monetaryValue: monetaryValue,
                highestStreak: highestStreak,
                history: firebase.firestore.FieldValue.arrayUnion(historyEntry),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Firebase updated successfully');
        } catch (error) {
            console.error('❌ Firebase update error:', error.message);
            console.log('💾 Saving to localStorage instead');
        }
        
        // Always save to localStorage as backup
        const localData = {
            currentStreak: currentStreak,
            monetaryValue: monetaryValue,
            highestStreak: highestStreak,
            history: workoutData.history || []
        };
        localData.history.push(historyEntry);
        localStorage.setItem(storageKey, JSON.stringify(localData));
        
        // Update workout data
        workoutData = localData;
        
        // Update display
        updateDisplay();
        
        // Update history display
        displayHistory(workoutData.history);
        
        // Show success message
        showMessage(`Great job! Workout completed! +1 streak, +$${workoutConfig.rewardPerWorkout.toLocaleString()} earned! 🏋️`, 'success');
    });
    
    // Handle reset button
    const resetButton = document.getElementById('resetButton');
    resetButton.addEventListener('click', async function() {
        if (confirm('Are you sure you want to reset your streak? Your monetary value will remain unchanged.')) {
            // Reset streak only (monetary value stays the same)
            const previousStreak = currentStreak;
            currentStreak = 0;
            
            // Create history entry
            const now = new Date();
            const historyEntry = {
                action: 'streak_reset',
                date: now.toLocaleDateString(),
                time: now.toLocaleTimeString(),
                streakBefore: previousStreak,
                streakAfter: currentStreak,
                monetaryValueAfter: monetaryValue,
                highestStreakAfter: highestStreak,
                timestamp: now.toISOString()
            };
            
            // Save to storage
            try {
                // Try Firebase first
                console.log('🔄 Resetting streak in Firebase...');
                await db.collection('workout-coupons').doc(couponType).update({
                    currentStreak: currentStreak,
                    history: firebase.firestore.FieldValue.arrayUnion(historyEntry),
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('✅ Streak reset in Firebase');
            } catch (error) {
                console.error('❌ Firebase reset error:', error.message);
                console.log('💾 Saving to localStorage instead');
            }
            
            // Always save to localStorage as backup
            const localData = {
                currentStreak: currentStreak,
                monetaryValue: monetaryValue,
                highestStreak: highestStreak,
                history: workoutData.history || []
            };
            localData.history.push(historyEntry);
            localStorage.setItem(storageKey, JSON.stringify(localData));
            
            // Update workout data
            workoutData = localData;
            
            // Update display
            updateDisplay();
            
            // Update history display
            displayHistory(workoutData.history);
            
            // Show success message
            showMessage('Streak reset! Your monetary value remains unchanged. Ready for a fresh start! 🔄', 'success');
        }
    });
    
    function showMessage(message, type) {
        const workoutMessage = document.getElementById('workoutMessage');
        workoutMessage.textContent = message;
        workoutMessage.className = 'workout-message ' + type;
        workoutMessage.classList.remove('hidden');
        
        setTimeout(() => {
            workoutMessage.classList.add('hidden');
        }, 5000);
    }
    
    function displayHistory(history) {
        const historyContainer = document.getElementById('workoutHistory');
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
                
                if (entry.action === 'workout_completed') {
                    li.innerHTML = `
                        <strong>🏋️ Workout Completed</strong> on ${entry.date} at ${entry.time}<br>
                        <small>Streak: ${entry.streakAfter}, Monetary Value: $${entry.monetaryValueAfter.toLocaleString()}, 
                        Highest Streak: ${entry.highestStreakAfter}, Reward: +$${entry.rewardEarned.toLocaleString()}</small>
                    `;
                } else if (entry.action === 'streak_reset') {
                    li.innerHTML = `
                        <strong>🔄 Streak Reset</strong> on ${entry.date} at ${entry.time}<br>
                        <small>Previous Streak: ${entry.streakBefore}, New Streak: ${entry.streakAfter}, 
                        Monetary Value: $${entry.monetaryValueAfter.toLocaleString()}</small>
                    `;
                }
                
                historyList.appendChild(li);
            });
        }
    }
    
    // Reset function (available via button or Ctrl+Shift+R)
    window.resetWorkoutCoupon = async function() {
        if (confirm('Reset this workout coupon to its original state? This will clear all progress and monetary value.')) {
            currentStreak = workoutConfig.initialStreak;
            monetaryValue = workoutConfig.initialMonetaryValue;
            highestStreak = workoutConfig.initialHighestStreak;
            
            try {
                // Reset in Firebase
                await db.collection('workout-coupons').doc(couponType).set({
                    currentStreak: workoutConfig.initialStreak,
                    monetaryValue: workoutConfig.initialMonetaryValue,
                    highestStreak: workoutConfig.initialHighestStreak,
                    history: [],
                    resetAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('✅ Workout coupon reset in Firebase');
            } catch (error) {
                console.error('❌ Firebase reset error:', error.message);
            }
            
            // Reset localStorage
            localStorage.removeItem(storageKey);
            
            // Reset display and data
            workoutData = {
                currentStreak: workoutConfig.initialStreak,
                monetaryValue: workoutConfig.initialMonetaryValue,
                highestStreak: workoutConfig.initialHighestStreak,
                history: []
            };
            updateDisplay();
            document.getElementById('workoutHistory').classList.add('hidden');
            
            showMessage('Workout coupon has been reset!', 'success');
        }
    };
    
    // Keyboard shortcut for reset
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            window.resetWorkoutCoupon();
        }
    });
});
