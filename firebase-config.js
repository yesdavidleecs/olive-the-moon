// Firebase configuration
// IMPORTANT: Replace these values with your own Firebase project config
// Get these from Firebase Console > Project Settings > General > Your apps > Web app

const firebaseConfig = {
    apiKey: "AIzaSyDyBN63QH_jd2hjQ8l6fr9qaIrjDiSJU8U",
    authDomain: "olive-the-moon.firebaseapp.com",
    projectId: "olive-the-moon",
    storageBucket: "olive-the-moon.firebasestorage.app",
    messagingSenderId: "837670258704",
    appId: "1:837670258704:web:58e3a43ed132af6cede295",
    measurementId: "G-BPR95662EJ"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Helper functions for coupon data
const CouponStorage = {
    // Get coupon data
    async getCoupon(couponName) {
        try {
            console.log('📡 Attempting to fetch coupon data from Firebase...');
            const doc = await db.collection('coupons').doc(couponName).get();
            if (doc.exists) {
                console.log('✅ Successfully loaded data from Firebase (online storage)');
                return doc.data();
            } else {
                // Initialize new coupon
                console.log('🆕 Creating new coupon in Firebase...');
                const initialData = {
                    balance: 15000,
                    history: [],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                await this.saveCoupon(couponName, initialData);
                console.log('✅ New coupon created in Firebase');
                return initialData;
            }
        } catch (error) {
            console.error("❌ Firebase error:", error.message);
            console.warn('⚠️ FALLBACK: Loading data from localStorage instead of Firebase');
            
            const localBalance = localStorage.getItem(`coupon_${couponName}_balance`);
            const localHistory = localStorage.getItem(`coupon_${couponName}_history`);
            
            if (localBalance || localHistory) {
                console.log('💾 Found existing data in localStorage');
            } else {
                console.log('💾 No existing data, using default values from localStorage');
            }
            
            // Fallback to localStorage if Firebase fails
            return {
                balance: parseInt(localBalance || '15000'),
                history: JSON.parse(localHistory || '[]')
            };
        }
    },

    // Save coupon data
    async saveCoupon(couponName, data) {
        try {
            console.log('💾 Saving data to Firebase...');
            await db.collection('coupons').doc(couponName).set(data, { merge: true });
            console.log('✅ Data saved to Firebase successfully');
            // Also save to localStorage as backup
            localStorage.setItem(`coupon_${couponName}_balance`, data.balance.toString());
            localStorage.setItem(`coupon_${couponName}_history`, JSON.stringify(data.history || []));
            console.log('💾 Backup saved to localStorage');
            return true;
        } catch (error) {
            console.error("❌ Firebase save error:", error.message);
            console.warn('⚠️ FALLBACK: Saving to localStorage only');
            // Fallback to localStorage
            localStorage.setItem(`coupon_${couponName}_balance`, data.balance.toString());
            localStorage.setItem(`coupon_${couponName}_history`, JSON.stringify(data.history || []));
            console.log('💾 Data saved to localStorage (offline mode)');
            return false;
        }
    },

    // Update balance
    async updateBalance(couponName, newBalance) {
        try {
            console.log('🔄 Updating balance in Firebase...');
            await db.collection('coupons').doc(couponName).update({
                balance: newBalance,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Balance updated in Firebase');
            localStorage.setItem(`coupon_${couponName}_balance`, newBalance.toString());
            return true;
        } catch (error) {
            console.error("❌ Firebase update error:", error.message);
            console.warn('⚠️ FALLBACK: Updating localStorage only');
            localStorage.setItem(`coupon_${couponName}_balance`, newBalance.toString());
            console.log('💾 Balance updated in localStorage (offline mode)');
            return false;
        }
    },

    // Add to history
    async addToHistory(couponName, historyEntry) {
        try {
            console.log('📝 Adding redemption to Firebase history...');
            await db.collection('coupons').doc(couponName).update({
                history: firebase.firestore.FieldValue.arrayUnion(historyEntry),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ History updated in Firebase');
            // Also update localStorage
            const localHistory = JSON.parse(localStorage.getItem(`coupon_${couponName}_history`) || '[]');
            localHistory.push(historyEntry);
            localStorage.setItem(`coupon_${couponName}_history`, JSON.stringify(localHistory));
            return true;
        } catch (error) {
            console.error("❌ Firebase history error:", error.message);
            console.warn('⚠️ FALLBACK: Adding to localStorage history only');
            // Fallback to localStorage only
            const localHistory = JSON.parse(localStorage.getItem(`coupon_${couponName}_history`) || '[]');
            localHistory.push(historyEntry);
            localStorage.setItem(`coupon_${couponName}_history`, JSON.stringify(localHistory));
            console.log('💾 History saved to localStorage (offline mode)');
            return false;
        }
    },

    // Reset coupon
    async resetCoupon(couponName, initialAmount = 15000) {
        try {
            await db.collection('coupons').doc(couponName).set({
                balance: initialAmount,
                history: [],
                resetAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            localStorage.removeItem(`coupon_${couponName}_balance`);
            localStorage.removeItem(`coupon_${couponName}_history`);
            return true;
        } catch (error) {
            console.error("Error resetting coupon:", error);
            return false;
        }
    }
};