// Import Firestore from Firebase module
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, getDocs } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Initialize Firestore
const db = getFirestore();
const auth = getAuth();

console.log("Script is running");

// Initialize streak globally, but it will be updated after check-in
let streak = 0;
let lastCheckIn = localStorage.getItem('lastCheckIn') ? new Date(localStorage.getItem('lastCheckIn')) : null;

// Handle user registration and save to Firestore
document.getElementById('registrationForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const userName = document.getElementById('name').value;
    const userEmail = document.getElementById('email').value;
    const userPassword = document.getElementById('password').value;

    // Check if the password meets the minimum length requirement
    if (userPassword.length < 6) {
        alert('Password should be at least 6 characters long.');
        return; // Exit the function if the password is too short
    }

   try {
        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, userEmail, userPassword);
        const user = userCredential.user;

        // Save user details and initialize streak to 0 in Firestore
        await setDoc(doc(db, 'users', userEmail), {
            name: userName,
            email: userEmail,
            streak: 0 // Initial streak is 0
        });


        console.log('User registered successfully with streak 0');
        localStorage.setItem('userEmail', userEmail);

        // Hide registration form and show welcome message and leaderboard
        document.getElementById('registrationForm').style.display = 'none';
        document.getElementById('welcomeMessage').classList.remove('hidden');
        document.getElementById('leaderboard').style.display = 'block';
        document.getElementById('logoutButton').classList.remove('hidden');

        // Fetch the latest leaderboard from Firestore
        await fetchLeaderboard();

        // Set streak message to 0 since it's a new registration
        streak = 0;
        updateStreakMessage();

    } catch (error) {
        console.error('Error saving user data: ', error);
        alert('Error registering user. Please try again later.');
    }
});

// Handle user login
document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const userEmail = document.getElementById('loginEmail').value;
    const userPassword = document.getElementById('loginPassword').value;

    try {
        // Sign in the user
        const userCredential = await signInWithEmailAndPassword(auth, userEmail, userPassword);
        const user = userCredential.user;
        
        console.log('User logged in successfully');

        // Fetch user streak from Firestore and show welcome message
        const userDoc = await getDoc(doc(db, 'users', userEmail));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            streak = userData.streak;

            localStorage.setItem('userEmail', userEmail);

            // Show welcome message and leaderboard
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('welcomeMessage').classList.remove('hidden');
            document.getElementById('leaderboard').style.display = 'block';
            document.getElementById('logoutButton').classList.remove('hidden');

            updateStreakMessage();
            await fetchLeaderboard();
        }
    } catch (error) {
        console.error('Error logging in:', error);
        alert('Error logging in. Please check your credentials.');
    }
});

// Handle user logout
document.getElementById('logoutButton').addEventListener('click', async function() {
    try {
        await signOut(auth);
        console.log('User logged out successfully');
        
        // Hide welcome message and leaderboard, show login form
        document.getElementById('welcomeMessage').classList.add('hidden');
        document.getElementById('leaderboard').classList.add('hidden');
        document.getElementById('logoutButton').classList.add('hidden');
        document.getElementById('loginForm').style.display = 'block';

        localStorage.removeItem('userEmail');
    } catch (error) {
        console.error('Error logging out:', error);
    }
});

// Handle check-in and update streak in Firestore
document.getElementById('checkInButton').addEventListener('click', async function() {
    const userEmail = localStorage.getItem('userEmail');

    try {
        // Fetch current streak from Firestore, increment, and update it
        const userDoc = await getDoc(doc(db, 'users', userEmail));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            streak = userData.streak + 1; // Increment streak

            // Update streak in Firestore
            await updateDoc(doc(db, 'users', userEmail), { streak: streak });
            console.log('User streak updated in Firestore');

            // Update the leaderboard and streak message
            await fetchLeaderboard();
            updateStreakMessage();

            alert('Check-in successful! Your streak is now: ' + streak + ' days');
        } else {
            console.log('User not found in Firestore');
        }

    } catch (error) {
        console.error('Error updating streak: ', error);
        alert('Error checking in. Please try again later.');
    }
});

// Fetch and display user data on page load
window.onload = async function() {
    const userEmail = localStorage.getItem('userEmail');

    if (userEmail) {
        try {
            await fetchLeaderboard();

            // Since this is page load, we don't need to fetch streak unless it's for display purposes
            const userDoc = await getDoc(doc(db, 'users', userEmail));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                streak = userData.streak || 0;

                updateStreakMessage();
                document.getElementById('welcomeMessage').classList.remove('hidden');
                document.getElementById('leaderboard').style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading user data: ', error);
            alert('Error loading user data. Please try again later.');
        }
    }
};

// Function to fetch leaderboard data from Firestore
const fetchLeaderboard = async () => {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = ''; // Clear existing leaderboard

    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(query(usersCollection));
    const leaderboardData = [];

    usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        leaderboardData.push({ name: userData.name, streak: userData.streak });
    });

    // Sort leaderboard based on streak
    leaderboardData.sort((a, b) => b.streak - a.streak);

    leaderboardData.forEach(user => {
        const listItem = document.createElement('li');
        listItem.innerText = `${user.name}: ${user.streak} days`;
        leaderboardList.appendChild(listItem);
        console.log(`Added ${user.name}: ${user.streak} days to leaderboard`);
    });

    console.log('Leaderboard updated');
};

// Update streak message without creating new elements
const updateStreakMessage = () => {
    const streakMessage = document.getElementById('streakMessage');
    if (streakMessage) {
        streakMessage.innerText = `Your current streak: ${streak} days`;
    } else {
        const newStreakMessage = document.createElement('p');
        newStreakMessage.id = 'streakMessage';
        newStreakMessage.innerText = `Your current streak: ${streak} days`;
        document.getElementById('welcomeMessage').appendChild(newStreakMessage);
    }
};

// Show registration form and hide login form when "Create Account" is clicked
document.getElementById('showRegisterButton').addEventListener('click', function() {
    // Hide login form
    document.getElementById('loginForm').style.display = 'none';
    // Show registration form
    document.getElementById('registrationForm').classList.remove('hidden');
    document.getElementById('registrationForm').style.display = 'block';
});


// Check if streak should be reset
const resetStreak = () => {
    streak = 0;
    localStorage.setItem('streak', streak);
    alert('You missed a day! Your streak has been reset to 0.');
};

const checkMissedDay = () => {
    const lastCheckIn = localStorage.getItem('lastCheckIn') ? new Date(localStorage.getItem('lastCheckIn')) : null;
    if (lastCheckIn) {
        const today = new Date();
        const differenceInTime = today.getTime() - lastCheckIn.getTime();
        const differenceInDays = differenceInTime / (1000 * 3600 * 24);
        if (differenceInDays > 1) {
            resetStreak();
        }
    }
};

checkMissedDay();
updateStreakMessage();
