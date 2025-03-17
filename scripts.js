document.addEventListener('DOMContentLoaded', () => {
    let quests = []; // Array for quests loaded from JSON
    const ranks = ["E", "D", "C", "B", "A", "S", "SS"];
    const motivationalMessages = [
      "Keep pushing your limits!",
      "Great job – you are unstoppable!",
      "Every step makes you stronger!",
      "Believe in your power!",
      "Discipline is the key to greatness!"
    ];
  
    // Player object; loaded from localStorage or set via registration
    let player = {};
  
    // Show registration modal only on first visit; otherwise hide it
    if (!localStorage.getItem('player')) {
      document.getElementById('registration-modal').style.display = 'flex';
    } else {
      player = JSON.parse(localStorage.getItem('player'));
      // Hide registration modal if player data exists
      document.getElementById('registration-modal').style.display = 'none';
      applyGenderTheme(player.gender);
      updatePlayerStatus();
      initializeApp();
    }
  
    // Registration form submission
    document.getElementById('registration-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const age = document.getElementById('reg-age').value;
      const gender = document.getElementById('reg-gender').value;
      player = {
        name,
        age,
        gender,
        rank: "E",
        level: 1,
        points: 0,
        title: generateTitle(),
        completedQuests: [],
        activeQuest: null,
        skills: []
      };
      localStorage.setItem('player', JSON.stringify(player));
      applyGenderTheme(gender);
      updatePlayerStatus();
      // Hide registration modal after successful registration
      document.getElementById('registration-modal').style.display = 'none';
      initializeApp();
    });
  
    function applyGenderTheme(gender) {
      const color = (gender === "girl") ? "#ff69b4" : "#00aaff";
      document.documentElement.style.setProperty('--accent-color', color);
    }
  
    function initializeApp() {
      loadPlayerData();
      loadQuestsOffline();
      setupPlayerSearch();
      setupNotifications();
    }

    // New function to handle notifications across platforms
    function setupNotifications() {
      // Check if this is a mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if ('Notification' in window) {
        if (isMobile) {
          // On mobile, we'll show a button to request permission
          const notifButton = document.createElement('button');
          notifButton.id = 'notification-permission-btn';
          notifButton.innerText = 'Enable Quest Notifications';
          notifButton.classList.add('permission-button');
          notifButton.addEventListener('click', requestNotificationPermission);
          
          // Add the button after the status window
          const statusWindow = document.querySelector('.status-window');
          statusWindow.parentNode.insertBefore(notifButton, statusWindow.nextSibling);
          
          // Hide button if permission already granted
          if (Notification.permission === 'granted') {
            notifButton.style.display = 'none';
          }
        } else {
          // On desktop, we can request directly
          requestNotificationPermission();
        }
      }
    }
    
    // Separate function to request notification permission
    function requestNotificationPermission() {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          // Hide the button if it exists
          const notifButton = document.getElementById('notification-permission-btn');
          if (notifButton) {
            notifButton.style.display = 'none';
          }
          
          // Show a test notification to confirm it works
          const testNotification = new Notification('Quest System Ready!', {
            body: 'You will now receive notifications for new quests!',
            icon: './icon.png'
          });
          
          // If there's an active quest already, show notification for it again
          const questElement = document.querySelector('.quest');
          if (questElement) {
            const questText = questElement.querySelector('p').innerText;
            const questRank = questElement.querySelector('p:nth-child(2)').innerText.split(':')[1].trim();
            showQuestNotification({quest: questText, rank: questRank});
          }
        } else {
          // Show an in-app message explaining how to enable notifications
          showInAppNotification(
            'Notifications Disabled', 
            'Enable notifications in your browser settings to get quest alerts.'
          );
        }
      });
    }
  
    function loadPlayerData() {
      updatePlayerStatus();
    }
  
    function updatePlayerStatus() {
      document.getElementById('name').textContent = player.name;
      document.getElementById('age').textContent = player.age;
      document.getElementById('gender').textContent = player.gender;
      document.getElementById('rank').textContent = player.rank;
      document.getElementById('level').textContent = player.level;
      document.getElementById('points').textContent = player.points;
      document.getElementById('title').textContent = player.title;
    }
  
    function savePlayerData() {
      localStorage.setItem('player', JSON.stringify(player));
    }
  
    // New function to load quests with offline support
    function loadQuestsOffline() {
      // First try to get quests from localStorage
      const cachedQuests = localStorage.getItem('cachedQuests');
      if (cachedQuests) {
        quests = JSON.parse(cachedQuests);
        console.log('Loaded quests from cache');
        scheduleRandomQuest();
      }
      
      // Always try to fetch new quests, even if we have cached ones
      fetchQuests();
    }

    // Modified to support offline mode with quests.json as the source of truth
    function fetchQuests() {
      // Use relative path for fetch
      fetch('./quests.json')
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          console.log('Successfully loaded quests from quests.json');
          quests = data;
          // Always update the cache with the latest quests
          localStorage.setItem('cachedQuests', JSON.stringify(data));
          
          // If this is the first quest, schedule one immediately
          if (!document.querySelector('.quest')) {
            scheduleRandomQuest();
          }
        })
        .catch(err => {
          console.error("Error loading quests:", err);
          // Try to load quests from localStorage first
          const cachedQuests = localStorage.getItem('cachedQuests');
          if (cachedQuests) {
            quests = JSON.parse(cachedQuests);
            console.log('Using cached quests from localStorage');
            if (!document.querySelector('.quest')) {
              scheduleRandomQuest();
            }
          } else {
            // If no localStorage cache, use fallback quests
            quests = getFallbackQuests();
            localStorage.setItem('cachedQuests', JSON.stringify(quests));
            console.log('Using fallback quests');
            scheduleRandomQuest();
          }
        });
    }
  
    // Fallback quests to use when offline and no cache exists
    function getFallbackQuests() {
      return JSON.parse(JSON.stringify([
        {"quest": "Do 20 push-ups", "rank": "E", "time": "10min"},
        {"quest": "Take a 15-minute walk", "rank": "E", "time": "15min"},
        {"quest": "Drink a glass of water", "rank": "E", "time": "5min"},
        {"quest": "Stretch for 5 minutes", "rank": "E", "time": "5min"},
        {"quest": "Practice deep breathing for 3 minutes", "rank": "E", "time": "3min"}
      ]));
    }
  
    // Returns a random quest time (in seconds) between 1 minute and 5 hours
    function getRandomTime() {
      return Math.floor(Math.random() * (18000 - 60 + 1)) + 60;
    }
  
    // Return a random quest from the available quests
    function getRandomQuest() {
      const randomIndex = Math.floor(Math.random() * quests.length);
      return quests[randomIndex];
    }
  
    // Improved display quest function with better notification
    function displayQuest(quest) {
      const questContainer = document.getElementById('quest-container');
      questContainer.innerHTML = '';
      const questElement = document.createElement('div');
      questElement.classList.add('quest');
      // Generate a random time for the quest
      const questTime = getRandomTime();
      questElement.innerHTML = `
        <p>${quest.quest}</p>
        <p><strong>Target Rank:</strong> ${quest.rank}</p>
        <p><strong>Time:</strong> ${formatTime(questTime)}</p>
        <button onclick="acceptQuest(this, ${questTime}, '${quest.quest}')">Accept</button>
        <button onclick="declineQuest(this)">Decline</button>
        <div class="countdown"></div>
      `;
      questContainer.appendChild(questElement);
      
      // Trigger notification with vibration, sound, and visual alert
      showQuestNotification(quest);
    }
    
    // New function specifically for quest notifications
    function showQuestNotification(quest) {
      // Create notification text
      const notificationTitle = 'New Quest Available!';
      const notificationBody = `${quest.quest} (Rank ${quest.rank})`;
      
      // Play notification sound
      playSound();
      
      // Vibrate if available (mobile)
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
      
      // First check if we can use the Notification API
      if (Notification.permission === 'granted') {
        try {
          // Create and show notification
          const notification = new Notification(notificationTitle, {
            body: notificationBody,
            icon: './icon.png',
            badge: './icon.png',
            tag: 'new-quest-notification',
            renotify: true,
            requireInteraction: true // Keep notification until user interacts with it
          });
          
          // When notification is clicked, focus the window and accept the quest
          notification.onclick = function() {
            window.focus();
            this.close();
          };
        } catch (error) {
          console.error('Notification error:', error);
          // Fallback to in-app notification
          showInAppNotification(notificationTitle, notificationBody);
        }
      } else if (Notification.permission !== 'denied') {
        // If permission not granted yet, ask for it
        const notifButton = document.getElementById('notification-permission-btn');
        if (notifButton) {
          notifButton.style.display = 'block';
          notifButton.classList.add('notify-pulse');
          setTimeout(() => {
            notifButton.classList.remove('notify-pulse');
          }, 2000);
        }
        
        // Show in-app notification as fallback
        showInAppNotification(notificationTitle, notificationBody);
      } else {
        // Permission denied - use in-app notification
        showInAppNotification(notificationTitle, notificationBody);
      }
    }
    
    // In-app notification for when system notifications aren't available
    function showInAppNotification(title, message) {
      // Create notification element
      const notifElement = document.createElement('div');
      notifElement.className = 'in-app-notification';
      notifElement.innerHTML = `
        <div class="notification-content">
          <h3>${title}</h3>
          <p>${message}</p>
        </div>
        <button class="close-notification">×</button>
      `;
      
      // Add to body
      document.body.appendChild(notifElement);
      
      // Show with animation
      setTimeout(() => {
        notifElement.classList.add('show');
      }, 10);
      
      // Add close button functionality
      notifElement.querySelector('.close-notification').addEventListener('click', () => {
        notifElement.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(notifElement);
        }, 300);
      });
      
      // Auto-close after 10 seconds
      setTimeout(() => {
        if (document.body.contains(notifElement)) {
          notifElement.classList.remove('show');
          setTimeout(() => {
            if (document.body.contains(notifElement)) {
              document.body.removeChild(notifElement);
            }
          }, 300);
        }
      }, 10000);
    }
  
    // Schedule a random quest (simulating daily notifications)
    // Using a shorter delay for testing offline mode
    function scheduleRandomQuest() {
      // For the purpose of testing, we'll use a shorter delay
      // 5-30 seconds instead of 5 mins to 6 hours
      const delay = Math.floor(Math.random() * (30000 - 5000 + 1)) + 5000;
      console.log(`Scheduling next quest in ${delay/1000} seconds`);
      
      setTimeout(() => {
        const quest = getRandomQuest();
        displayQuest(quest);
      }, delay);
    }
  
    // When player accepts a quest, remove Accept/Decline buttons, show timer and a Done button
    window.acceptQuest = function (button, time, questText) {
      const questElement = button.parentElement;
      // Remove both Accept and Decline buttons
      const buttonElements = questElement.querySelectorAll('button');
      buttonElements.forEach(btn => btn.remove());
      
      const countdownElement = questElement.querySelector('.countdown');
      let timeLeft = parseTime(time);
      playSound();
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      const countdownInterval = setInterval(() => {
        if (timeLeft <= 0) {
          clearInterval(countdownInterval);
          // Quest failed: remove quest, deduct points, and schedule next quest
          questElement.remove();
          updatePoints(-10);
          scheduleRandomQuest();
        } else {
          countdownElement.textContent = `Time left: ${formatTime(timeLeft)}`;
          timeLeft--;
        }
      }, 1000);
      
      // Create and show the Done button
      const doneButton = document.createElement('button');
      doneButton.textContent = 'Done';
      doneButton.onclick = () => completeQuest(doneButton, countdownInterval, questText);
      questElement.appendChild(doneButton);
    };
  
    // Decline quest immediately
    window.declineQuest = function (button) {
      const questElement = button.parentElement;
      questElement.remove();
      updatePoints(-10);
      scheduleRandomQuest();
    };
  
    // Complete quest: clear timer, update points, and schedule next quest
    function completeQuest(button, countdownInterval, questText) {
      clearInterval(countdownInterval);
      const questElement = button.parentElement;
      questElement.remove();
      updatePoints(20);
      showMotivationalMessage();
      playSound();
      if (navigator.vibrate) {
        navigator.vibrate(300);
      }
      scheduleRandomQuest();
    }
  
    function updatePoints(points) {
      player.points += points;
      if (player.points >= 100) {
        rankUp();
      }
      document.getElementById('points').textContent = player.points;
      savePlayerData();
    }
  
    function rankUp() {
      const currentRankIndex = ranks.indexOf(player.rank);
      if (currentRankIndex < ranks.length - 1) {
        player.points -= 100;
        player.rank = ranks[currentRankIndex + 1];
        player.level++;
        player.title = generateTitle();
        updatePlayerStatus();
        savePlayerData();
      }
    }
  
    // Parse time: if given a number, return it; if string and includes "h", convert hours to seconds
    function parseTime(timeVal) {
      if (typeof timeVal === 'number') {
        return timeVal;
      }
      if (timeVal.toLowerCase().includes('h')) {
        return parseInt(timeVal) * 3600;
      }
      return parseInt(timeVal);
    }
  
    function formatTime(seconds) {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      let timeStr = "";
      if (hrs > 0) {
        timeStr += hrs + "h ";
      }
      if (mins > 0 || hrs > 0) {
        timeStr += mins + "m ";
      }
      timeStr += secs + "s";
      return timeStr;
    }
  
    function lockScreen(duration) {
      const overlay = document.createElement('div');
      overlay.className = 'lock-screen';
      overlay.innerHTML = `<p>Time is up! Screen locked for ${duration / 1000} seconds.</p>`;
      document.body.appendChild(overlay);
      setTimeout(() => {
        overlay.remove();
        scheduleRandomQuest();
      }, duration);
    }
  
    function showNotification(message) {
      if (Notification.permission === 'granted') {
        try {
          const notification = new Notification('Quest System', {
            body: message,
            icon: './icon.png'
          });
          
          // Auto close notification after 5 seconds on mobile
          if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            setTimeout(() => {
              notification.close();
            }, 5000);
          }
          
          // Add click event to notification
          notification.onclick = function() {
            window.focus();
            this.close();
          };
        } catch (error) {
          console.error('Notification error:', error);
        }
      } else if (Notification.permission !== 'denied') {
        // This is likely a mobile device that needs user interaction first
        const notifButton = document.getElementById('notification-permission-btn');
        if (notifButton) {
          notifButton.style.display = 'block';
          // Add a visual indicator that there's a new quest
          notifButton.classList.add('notify-pulse');
          setTimeout(() => {
            notifButton.classList.remove('notify-pulse');
          }, 2000);
        }
      }
    }
  
    // Enhanced sound for notifications
    function playSound() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Use a nicer notification sound (a major chord)
        gainNode.gain.value = 0.1; // Lower volume
        oscillator.type = 'sine';
        
        // Play a pleasant chord
        oscillator.frequency.value = 523.25; // C5
        oscillator.start();
        
        // Fade out
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        
        // Stop after 1.5 seconds
        setTimeout(() => {
          oscillator.stop();
        }, 1500);
      } catch (e) {
        console.error('Error playing sound:', e);
      }
    }
  
    function showMotivationalMessage() {
      const msg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      showNotification(msg);
    }
  
    function generateTitle() {
      const titles = {
        "E": ["The Rising Star", "The Newcomer"],
        "D": ["The Disciplined One", "The Steady"],
        "C": ["The Challenger", "The Determined"],
        "B": ["The Brave", "The Bold"],
        "A": ["The Achiever", "The Ace"],
        "S": ["The Superior", "The Striver"],
        "SS": ["The Supreme", "The Unstoppable"]
      };
      const available = titles[player && player.rank ? player.rank : "E"];
      return available[Math.floor(Math.random() * available.length)];
    }
  
    // Enhanced player search with local storage
    function setupPlayerSearch() {
      // Get default sample players
      let samplePlayers = [
        { name: "Alice", rank: "B", level: 5 },
        { name: "Bob", rank: "D", level: 3 },
        { name: "Charlie", rank: "S", level: 7 },
        { name: "Diana", rank: "A", level: 6 }
      ];
      
      // Try to load players from local storage
      const storedPlayers = localStorage.getItem('samplePlayers');
      if (storedPlayers) {
        samplePlayers = JSON.parse(storedPlayers);
      } else {
        // If not found, store the default ones
        localStorage.setItem('samplePlayers', JSON.stringify(samplePlayers));
      }
      
      // Add current player to list if not already there
      if (player && player.name) {
        const playerExists = samplePlayers.some(p => p.name === player.name);
        if (!playerExists) {
          samplePlayers.push({
            name: player.name,
            rank: player.rank,
            level: player.level
          });
          localStorage.setItem('samplePlayers', JSON.stringify(samplePlayers));
        }
      }

      document.getElementById('player-search-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const searchName = document.getElementById('search-name').value.toLowerCase();
        const results = samplePlayers.filter(p => {
          return p.name.toLowerCase().includes(searchName);
        });
  
        const resultsContainer = document.getElementById('player-search-results');
        resultsContainer.innerHTML = '';
        if (results.length === 0) {
          resultsContainer.innerHTML = '<p>No players found.</p>';
        } else {
          results.forEach(p => {
            const div = document.createElement('div');
            div.className = 'player-entry';
            div.innerHTML = `<p><strong>${p.name}</strong><br/>Rank: ${p.rank}<br/>Level: ${p.level}</p>`;
            resultsContainer.appendChild(div);
          });
        }
      });
    }
    
    // Check connection status
    window.addEventListener('online', () => {
      console.log('Application is back online');
      fetchQuests(); // Refresh quests when back online
    });
    
    window.addEventListener('offline', () => {
      console.log('Application is offline');
    });
  });
