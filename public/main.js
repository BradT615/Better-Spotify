let spotifyPlayer;  // Global reference to the Spotify player

document.addEventListener("DOMContentLoaded", function() {

  function updateProfile(data) {
    let imageUrl = data.images.length > 0 ? data.images[0].url : 'assets/default-image.png';
    document.getElementById('user-name').textContent = data.display_name;
    document.querySelectorAll('.user-image').forEach(img => img.src = imageUrl);
  }

  function updateUserState(isLoggedIn, data = null) {
    if (isLoggedIn) {
      updateProfile(data);
      initializeLoggedInUser();
      document.getElementById('login').style.display = 'none';
      document.getElementById('loggedin').style.display = 'flex';
    } else {
      document.getElementById('login').style.display = 'flex';
      document.getElementById('loggedin').style.display = 'none';
    }
  }

  function deleteUser() {
    $.ajax({
        url: '/.netlify/functions/delete_user',
        type: 'DELETE',
        xhrFields: {
          withCredentials: true
        },
        success: function(response) {
          console.log("User data deleted successfully.");
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.error("Failed to delete user data:", errorThrown);
        }
    });
  }

  function refreshTokenAndRetry(retryCount = 1) {
    if (retryCount > 3) {
      updateUserState(false);
      return;
    }

    $.ajax({
      url: '/.netlify/functions/refresh_token',
      xhrFields: {
        withCredentials: true
      },
      success: function(response) {
        checkUserSession();
      },
      error: function(jqXHR, textStatus, errorThrown) {
        if (jqXHR.status === 401 || jqXHR.status === 502) {
          deleteUser();
          updateUserState(false);
          console.error("User possibly revoked access or there was an error refreshing the token.");
        } else {
          refreshTokenAndRetry(retryCount + 1);
        }
      }
    });
  }

  function checkUserSession(retryCount = 0) {
    $.ajax({
      url: '/.netlify/functions/get_user_profile',
      xhrFields: {
        withCredentials: true
      },
      success: function(response) {
        const data = typeof response === 'string' ? JSON.parse(response) : response;
        updateUserState(true, data);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        if ((jqXHR.status === 401 || jqXHR.status === 502) && retryCount < 1) {
          refreshTokenAndRetry();
        } else {
          updateUserState(false);
          console.error("Error fetching user profile:", errorThrown);
        }
      }
    });
  }

  function initializeLoggedInUser() {

    // Get the access token from your server using the Netlify function
    $.ajax({
      url: '/.netlify/functions/get_access_token',
      xhrFields: {
        withCredentials: true
      },
      success: function(response) {
        const parsedResponse = JSON.parse(response);
        const token = parsedResponse.access_token;
        console.log("Successfully fetched access token:", token);

        // Initialize the Spotify Player
        spotifyPlayer = new Spotify.Player({
          name: 'Better Spotify',
          getOAuthToken: cb => { cb(token); },
          volume: 0.2
        });

        // Add listeners to the player
        player.addListener('ready', ({ device_id }) => {
          console.log('Ready with Device ID', device_id);
      
          // For active device
          $.ajax({
            url: 'https://api.spotify.com/v1/me/player',
            type: 'PUT',
            data: JSON.stringify({
              device_ids: [device_id],
              play: false // auto play
            }),
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            success: function(response) {
              console.log("Web app is now the active Spotify playback device!");
            },
            error: function(error) {
              console.error("Error setting web app as active device:", error);
            }
          });
      });
        player.addListener('not_ready', ({ device_id }) => {
          console.log('Device ID has gone offline', device_id);
        });
        player.addListener('player_state_changed', state => {
          if (state && state.paused) {
            document.getElementById('playPauseButton').src = 'assets/play.png';
          } else {
            document.getElementById('playPauseButton').src = 'assets/pause.png';
          }
          // Update the song card
          const songName = state.track_window.current_track.name;
          const artistName = state.track_window.current_track.artists[0].name;
          const songImage = state.track_window.current_track.album.images[0].url;

          document.querySelector('.songCard h1.truncate').textContent = songName;
          document.querySelector('.songCard h1.truncate + h1').textContent = artistName;
          document.querySelector('.songCard img').src = songImage;
        });
      
        player.addListener('initialization_error', ({ message }) => {
          console.error("Initialization Error:", message);
        });
        player.addListener('authentication_error', ({ message }) => {
          console.error("Authentication Error:", message);
        });
        player.addListener('account_error', ({ message }) => {
          console.error("Account Error:", message);
        });
        
        // Add the play toggle functionality to your existing play/pause button
        document.getElementById('playPauseButton').onclick = function() {
          player.togglePlay().catch(error => {
            console.error("Error toggling playback:", error);
          });
      
          // Toggle the play/pause button image
          var currentSrc = this.src;
          if (currentSrc.includes('play.png')) {
            this.src = 'assets/pause.png';
          } else {
            this.src = 'assets/play.png';
          }
      };
      

        // Connect the player
        player.connect().then(success => {
          if (success) {
            console.log("Successfully connected to the player!");
          } else {
            console.warn("Failed to connect to the player.");
          }
        }).catch(err => {
          console.error("Error connecting to the player:", err);
        });

        let touchStartX;
        const songDetails = document.getElementById('songDetails');

        songDetails.addEventListener('touchstart', (e) => {
          touchStartX = e.touches[0].clientX;
        });

        songDetails.addEventListener('touchend', (e) => {
          let touchEndX = e.changedTouches[0].clientX;
          let difference = touchStartX - touchEndX;

          const swipeThreshold = 50;

          if (difference > swipeThreshold) { // Swiped left
            player.nextTrack().catch(error => {
              console.error("Error skipping to next track:", error);
            });
          } else if (difference < -swipeThreshold) { // Swiped right
            player.previousTrack().catch(error => {
              console.error("Error going to previous track:", error);
            });
          }
        });
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.error("Error fetching access token:", errorThrown);
      }
    });

    var dropdown = document.querySelector('.dropdown-menu');
    var userMenu = document.getElementById('user-menu');

    document.querySelector('.user-image').addEventListener('click', function() {
      dropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', function(event) {
      if (!userMenu.contains(event.target)) {
        dropdown.classList.add('hidden');
      }
    });
    userMenu.addEventListener('click', function(event) {
      event.stopPropagation();
    });

    var selectedColor = 'sky';
    var accentColor = 'bg-sky-400';
    function updateThemeColor() {
      document.querySelectorAll('.theme-color').forEach(function(element) {
        element.classList.remove(accentColor);
        element.classList.add('bg-' + selectedColor + '-400');
      });
      accentColor = 'bg-' + selectedColor + '-400';
    }
    updateThemeColor();
    document.querySelectorAll('.color-circle').forEach(function(circle) {
      circle.addEventListener('click', function() {
        document.querySelectorAll('.color-circle').forEach(function(c) {
          c.classList.remove('active');
        });
        circle.classList.add('active');
        selectedColor = circle.dataset.color;
        updateThemeColor();
      });
    });
    document.getElementById('logout-button').addEventListener('click', function() {
      if (spotifyPlayer) {
        spotifyPlayer.disconnect();
      }
      deleteUser();
      updateUserState(false);
    });
  }

  checkUserSession();

  document.getElementById('login-button').addEventListener('click', function() {
    window.location = '/.netlify/functions/login';
  });
});
