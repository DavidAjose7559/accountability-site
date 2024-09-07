// Firestore setup (using global Firebase namespace)
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const db = firebase.firestore();

console.log("Script is running");

// Handle user registration and save to Firestore
document.getElementById('registrationForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const userName = document.getElementById('name').value;
    const userEmail = document.getElementById('email').value;

    try {
        // Save user details and streak in Firestore
        await db.collection('users').doc(userEmail).set({
            name: userName,
            email: userEmail,
            streak: 0 // Initial streak
        });

        console.log('User data saved to Firestore');
        localStorage.setItem('userEmail', userEmail);

        // Hide registration form and show welcome message and leaderboard
        document.getElementById('registrationForm').style.display = 'none';
        document.getElementById('welcomeMessage').classList.remove('hidden');
        document.getElementById('leaderboard').style.display = 'block';

        updateUserStreak();
        updateLeaderboard();

    } catch (error) {
        console.error('Error saving user data: ', error);
        alert('Error registering user. Please try again later.');
    }
});

let streak = localStorage.getItem('streak') ? parseInt(localStorage.getItem('streak')) : 0;
let lastCheckIn = localStorage.getItem('lastCheckIn') ? new Date(localStorage.getItem('lastCheckIn')) : null;

// Display the current streak to the user
const updateStreakMessage = () => {
    const streakMessage = document.createElement('p');
    streakMessage.innerText = `Your current streak: ${streak} days`;
    document.getElementById('welcomeMessage').appendChild(streakMessage);
};

// Reset streak if a day is missed
const resetStreak = () => {
    streak = 0;
    localStorage.setItem('streak', streak);
    alert('You missed a day! Your streak has been reset to 0.');
};

// Check if streak should be reset
const checkMissedDay = () => {
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

// Dummy leaderboard data
const leaderboardData = [
    { name: 'John Doe', streak: 5 },
    { name: 'Jane Smith', streak: 7 },
    { name: 'Mark Johnson', streak: 3 },
    { name: 'User', streak: streak }
];

// Find and update user streak in leaderboard
const updateUserStreak = () => {
    const user = leaderboardData.find(user => user.name === 'User');
    if (user) {
        user.streak = streak;
        console.log('Updated user streak in leaderboard data:', user);
    } else {
        console.log('User not found in leaderboard data');
    }
};

const updateLeaderboard = () => {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';

    console.log('Updating leaderboard', leaderboardData);

    leaderboardData.sort((a, b) => b.streak - a.streak);

    leaderboardData.forEach(user => {
        const listItem = document.createElement('li');
        listItem.innerText = `${user.name}: ${user.streak} days`;
        leaderboardList.appendChild(listItem);
        console.log(`Added ${user.name}: ${user.streak} days to leaderboard`);
    });

    console.log('Leaderboard updated');
};

// Handle check-in and update streak in Firestore
document.getElementById('checkInButton').addEventListener('click', async function() {
    const userEmail = localStorage.getItem('userEmail');
    streak += 1;

    try {
        // Update streak in Firestore
        await db.collection('users').doc(userEmail).update({ streak: streak });
        console.log('User streak updated in Firestore');

        updateUserStreak();
        updateLeaderboard();

        alert('Check-in successful! Your streak is now: ' + streak + ' days');

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
            const userDoc = await db.collection('users').doc(userEmail).get();
            if (userDoc.exists()) {
                const userData = userDoc.data();
                streak = userData.streak || 0;

                document.getElementById('welcomeMessage').classList.remove('hidden');
                document.getElementById('leaderboard').style.display = 'block';
                updateStreakMessage();
                updateLeaderboard();
            } else {
                console.log('No such user found');
            }
        } catch (error) {
            console.error('Error fetching user data: ', error);
            alert('Error loading user data. Please try again later.');
        }
    }
};
