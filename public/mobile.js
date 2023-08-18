// mobile js

let player;

document.addEventListener("DOMContentLoaded", function() {

  let token;
  let deviceId;

  function updateProfile(data) {
    let imageUrl = data.images.length > 0 ? data.images[0].url : 'assets/default-image.png';
    document.getElementById('user-name').textContent = data.display_name;
    document.querySelectorAll('.user-image').forEach(img => img.src = imageUrl);
  }


  function fetchPlaylists(token, callback) {
    $.ajax({
      url: 'https://api.spotify.com/v1/me/playlists',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      success: callback,
      error: function(error) {
        console.error("Error fetching playlists:", error);
      }
    });
  }

  function displayPlaylists(playlists) {
    const playlistsList = document.getElementById('playlistsList');
    playlists.items.forEach(playlist => {
      let listItem = document.createElement('li');
      listItem.className = "flex items-center justify-between py-2 hover:bg-gray-100 cursor-pointer rounded";

      let img = document.createElement('img');
      img.src = playlist.images[0]?.url || 'assets/default-image.png';
      img.alt = "Playlist Image";
      img.className = "w-12 h-12 rounded mr-4";

      let span = document.createElement('span');
      span.textContent = playlist.name;

      let playButton = document.createElement('img');
      playButton.src = 'assets/play.png';
      playButton.alt = 'Play';
      playButton.className = "w-6 h-6 cursor-pointer";
      playButton.addEventListener('click', function(event) {
        playPlaylist(playlist.id);
        event.stopPropagation();
      });

      listItem.appendChild(img);
      listItem.appendChild(span);
      listItem.appendChild(playButton);

      listItem.addEventListener('click', function() {
        document.getElementById('dropdownTrigger').textContent = playlist.name;
        playlistsList.classList.add('hidden');
      });

      playlistsList.appendChild(listItem);
    });
  }


  document.getElementById('dropdownTrigger').addEventListener('click', function() {
    const playlistsList = document.getElementById('playlistsList');
    if (playlistsList.classList.contains('hidden')) {
      playlistsList.classList.remove('hidden');
    } else {
      playlistsList.classList.add('hidden');
    }
  });


  function playPlaylist(playlistId) {
    $.ajax({
      url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      success: function(response) {
        const uris = response.items.map(track => track.track.uri);
        $.ajax({
          url: `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, // Use deviceId here
          type: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: JSON.stringify({ uris: uris }),
          success: function() {
            console.log("Successfully started playback!");
          },
          error: function(error) {
            console.error("Error initiating playback:", error);
          }
        });
      },
      error: function(error) {
        console.error("Error fetching playlist tracks:", error);
      }
    });
  }

  function initializeLoggedInUser() {

    // Fetch user profile and update display
    $.ajax({
      url: '/.netlify/functions/get_user_profile',
      xhrFields: {
          withCredentials: true
      },
      success: function(response) {
          const data = typeof response === 'string' ? JSON.parse(response) : response;
          updateProfile(data);
      },
      error: function(jqXHR, textStatus, errorThrown) {
          console.error("Error fetching user profile:", errorThrown);
      }
    });

    $.ajax({
      url: '/.netlify/functions/get_access_token',
      xhrFields: {
        withCredentials: true
      },
      success: function(response) {
        const parsedResponse = JSON.parse(response);
        token = parsedResponse.access_token;


        fetchPlaylists(token, displayPlaylists);

        // Initialize the Spotify Player
        player = new Spotify.Player({
          name: 'Better Spotify',
          getOAuthToken: cb => { cb(token); },
          volume: 0.2
        });

        // Add listeners to the player
        player.addListener('ready', ({ device_id }) => {
          console.log('Ready with Device ID', device_id);
          deviceId = device_id;
  
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
      if (player) {
        player.disconnect();
      }
      deleteUser();
      updateUserState(false);
    });
  }

  initializeLoggedInUser()
  
});
