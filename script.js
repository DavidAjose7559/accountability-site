// Import Firestore from Firebase module
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, getDocs } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Initialize Firestore
const db = getFirestore();
const auth = getAuth();

console.log("Script is running");

// Initialize streak globally
let streak = 0;

// Handle "Create Account" button click
document.getElementById('showRegisterButton').addEventListener('click', function() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('createAccountSection').style.display = 'none';

    // Show registration form and "Existing User? Login" button
    document.getElementById('registrationForm').classList.remove('hidden');
    document.getElementById('registrationForm').style.display = 'block';
    document.getElementById('existingUserSection').classList.remove('hidden');
    document.getElementById('existingUserSection').style.display = 'block';

    // Hide leaderboard and welcome message
    document.getElementById('leaderboard').classList.add('hidden');
    document.getElementById('welcomeMessage').classList.add('hidden');
});

// Handle "Login" button click
document.getElementById('showLoginButton').addEventListener('click', function() {
    document.getElementById('registrationForm').style.display = 'none';
    document.getElementById('existingUserSection').style.display = 'none';

    // Show login form and "Create Account" button
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('createAccountSection').style.display = 'block';

    // Hide leaderboard and welcome message
    document.getElementById('leaderboard').classList.add('hidden');
    document.getElementById('welcomeMessage').classList.add('hidden');
});

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
            streak: 0
        });

        console.log('User registered successfully with streak 0');
        localStorage.setItem('userEmail', userEmail);

        // Hide registration form and show welcome message and leaderboard
        document.getElementById('registrationForm').style.display = 'none';
        document.getElementById('createAccountSection').style.display = 'none';
        document.getElementById('welcomeMessage').classList.remove('hidden');
        document.getElementById('logoutButton').classList.remove('hidden');
        document.getElementById('leaderboard').style.display = 'block';

        // Fetch the latest leaderboard from Firestore
        await fetchLeaderboard();

        // Set streak message to 0
        streak = 0;
        updateStreakMessage();
    } catch (error) {
        console.error('Error registering user: ', error.message);
        alert('Error registering user. Please try again later.');
    }
});

// Handle user login with "Remember Me" functionality
document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const userEmail = document.getElementById('loginEmail').value;
    const userPassword = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    try {
        // Sign in the user
        const userCredential = await signInWithEmailAndPassword(auth, userEmail, userPassword);
        const user = userCredential.user;

        console.log('User logged in successfully');

        const userDoc = await getDoc(doc(db, 'users', userEmail));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            streak = userData.streak;

            localStorage.setItem('userEmail', userEmail);

            // Hide login form and show welcome message and leaderboard
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('createAccountSection').style.display = 'none';
            document.getElementById('welcomeMessage').classList.remove('hidden');
            document.getElementById('leaderboard').style.display = 'block';
            document.getElementById('logoutButton').classList.remove('hidden');

            updateStreakMessage();
            await fetchLeaderboard();
        } else {
            console.error('User data not found in Firestore');
        }
    } catch (error) {
        console.error('Error logging in: ', error.message);
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
        document.getElementById('createAccountSection').style.display = 'block';

        localStorage.removeItem('userEmail');
    } catch (error) {
        console.error('Error logging out:', error);
    }
});

// Fetch and display user data on page load
window.onload = async function() {
    const userEmail = localStorage.getItem('userEmail');

    if (userEmail) {
        try {
            await fetchLeaderboard();

            const userDoc = await getDoc(doc(db, 'users', userEmail));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                streak = userData.streak || 0;

                updateStreakMessage();
                document.getElementById('welcomeMessage').classList.remove('hidden');
                document.getElementById('leaderboard').classList.remove('hidden');
                document.getElementById('logoutButton').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error loading user data:', error.message);
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

    leaderboardData.sort((a, b) => b.streak - a.streak); // Sort by streak

    leaderboardData.forEach(user => {
        const listItem = document.createElement('li');
        listItem.innerText = `${user.name}: ${user.streak} days`;
        leaderboardList.appendChild(listItem);
        console.log(`Added ${user.name}: ${user.streak} days to leaderboard`);
    });

    console.log('Leaderboard updated');
};

// Update streak message
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
