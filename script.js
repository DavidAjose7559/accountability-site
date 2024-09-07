// Import Firestore from Firebase module
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, getDocs } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Initialize Firestore
const db = getFirestore();

console.log("Script is running");

// Initialize streak globally, but it will be updated after check-in
let streak = 0;
let lastCheckIn = localStorage.getItem('lastCheckIn') ? new Date(localStorage.getItem('lastCheckIn')) : null;

// Handle user registration and save to Firestore
document.getElementById('registrationForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const userName = document.getElementById('name').value;
    const userEmail = document.getElementById('email').value;

    try {
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
