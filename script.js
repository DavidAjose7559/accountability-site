// Import Firestore from Firebase module
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Initialize Firestore
const db = getFirestore();

console.log("Script is running");

// Initialize streak globally, but it will be updated with Firestore data
let streak = 0;
let lastCheckIn = localStorage.getItem('lastCheckIn') ? new Date(localStorage.getItem('lastCheckIn')) : null;

// Dummy leaderboard data (excluding the User part, it will be dynamically updated)
const leaderboardData = [
    { name: 'John Doe', streak: 5 },
    { name: 'Jane Smith', streak: 7 },
    { name: 'Mark Johnson', streak: 3 }
];

// Handle user registration and save to Firestore
document.getElementById('registrationForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const userName = document.getElementById('name').value;
    const userEmail = document.getElementById('email').value;

    try {
        // Save user details and streak in Firestore
        await setDoc(doc(db, 'users', userEmail), {
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

        // Update leaderboard with the new user
        leaderboardData.push({ name: userName, streak: 0 });
        updateLeaderboard();
        updateStreakMessage();

    } catch (error) {
        console.error('Error saving user data: ', error);
        alert('Error registering user. Please try again later.');
    }
});

// Handle check-in and update streak in Firestore
document.getElementById('checkInButton').addEventListener('click', async function() {
    const userEmail = localStorage.getItem('userEmail');
    streak += 1;

    try {
        // Update streak in Firestore
        await updateDoc(doc(db, 'users', userEmail), { streak: streak });
        console.log('User streak updated in Firestore');

        updateLeaderboard();
        updateStreakMessage();

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
            const userDoc = await getDoc(doc(db, 'users', userEmail));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                streak = userData.streak || 0;

                // Update welcome message
                document.getElementById('welcomeMessage').classList.remove('hidden');
                document.getElementById('leaderboard').style.display = 'block';

                // Add the user to the leaderboard dynamically
                leaderboardData.push({ name: userData.name, streak: userData.streak });

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

// Update leaderboard
const updateLeaderboard = async () => {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';

    console.log('Updating leaderboard', leaderboardData);

    // Update leaderboard based on streak values
    leaderboardData.sort((a, b) => b.streak - a.streak);

    leaderboardData.forEach(user => {
        const listItem = document.createElement('li');
        listItem.innerText = `${user.name}: ${user.streak} days`;
        leaderboardList.appendChild(listItem);
        console.log(`Added ${user.name}: ${user.streak} days to leaderboard`);
    });

    console.log('Leaderboard updated');
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
