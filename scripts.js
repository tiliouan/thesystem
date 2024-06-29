document.addEventListener('DOMContentLoaded', () => {
    const questContainer = document.getElementById('quest-container');
    let quests = [];
    let player = {
        name: "Player 0",
        age: 23,
        hobbies: ["Gaming", "Reading"],
        level: 1,
        points: 0
    };

    function loadPlayerData() {
        const savedPlayer = localStorage.getItem('player');
        if (savedPlayer) {
            player = JSON.parse(savedPlayer);
        }
        updatePlayerStatus();
    }

    function updatePlayerStatus() {
        document.getElementById('name').textContent = player.name;
        document.getElementById('age').textContent = player.age;
        document.getElementById('hobbies').textContent = player.hobbies.join(', ');
        document.getElementById('level').textContent = player.level;
        document.getElementById('points').textContent = player.points;
    }

    function savePlayerData() {
        localStorage.setItem('player', JSON.stringify(player));
    }

    function fetchQuests() {
        fetch('quests.json')
            .then(response => response.json())
            .then(data => {
                quests = data;
                scheduleRandomQuest();
            });
    }

    function getRandomQuest() {
        const randomIndex = Math.floor(Math.random() * quests.length);
        return quests[randomIndex];
    }

    function displayQuest(quest) {
        questContainer.innerHTML = '';
        const questElement = document.createElement('div');
        questElement.classList.add('quest');
        questElement.innerHTML = `
            <p>${quest.quest}</p>
            <button onclick="acceptQuest(this, '${quest.time}')">Accept</button>
            <button onclick="declineQuest(this)">Decline</button>
            <div class="countdown"></div>
        `;
        questContainer.appendChild(questElement);
        showNotification('New quest available!');
    }

    function scheduleRandomQuest() {
        const delay = Math.random() * 6000 + 6000; // Between 1 and 2 minutes
        setTimeout(() => {
            const quest = getRandomQuest();
            displayQuest(quest);
        }, delay);
    }

    window.acceptQuest = function (button, time) {
        const questElement = button.parentElement;
        const countdownElement = questElement.querySelector('.countdown');
        let timeLeft = parseTime(time); // Get time in seconds
        const countdownInterval = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                alert('Time is up!');
                declineQuest(button); // If time runs out, treat as declined
            } else {
                countdownElement.textContent = `Time left: ${formatTime(timeLeft)}`;
                timeLeft--;
            }
        }, 1000);
        button.disabled = true;
        const doneButton = document.createElement('button');
        doneButton.textContent = 'Done';
        doneButton.onclick = () => completeQuest(doneButton, countdownInterval);
        questElement.appendChild(doneButton);
    }

    window.declineQuest = function (button) {
        const questElement = button.parentElement;
        questElement.remove();
        updatePoints(-10); // Deduct points for declining
        scheduleRandomQuest(); // Schedule next quest
    }

    function completeQuest(button, countdownInterval) {
        clearInterval(countdownInterval);
        const questElement = button.parentElement;
        questElement.remove();
        updatePoints(20); // Add points for completing
        scheduleRandomQuest(); // Schedule next quest
    }

    function updatePoints(points) {
        player.points += points;
        document.getElementById('points').textContent = player.points;
        savePlayerData();
        if (player.points >= 100) {
            levelUp();
        }
    }

    function levelUp() {
        player.level++;
        player.points = 0; // Reset points after leveling up
        updatePlayerStatus();
        savePlayerData();
    }

    function parseTime(time) {
        const [value, unit] = time.split(/(\d+)/).filter(Boolean);
        const multiplier = { min: 60, h: 3600 }[unit] || 1;
        return parseInt(value) * multiplier;
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    }

    function showNotification(message) {
        if (Notification.permission === 'granted') {
            new Notification(message);
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(message);
                }
            });
        }
    }

    if ('Notification' in window) {
        Notification.requestPermission();
    }

    loadPlayerData();
    fetchQuests();
});
