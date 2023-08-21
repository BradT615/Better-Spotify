// Desktop js

document.getElementById("loading-screen").style.display = "none";
document.getElementById("loggedin").style.display = "flex";

function updateProfile(data) {
    let imageUrl = data.images.length > 0 ? data.images[0].url : 'assets/default-image.png';
    document.getElementById('user-name').textContent = data.display_name;
    document.querySelectorAll('.user-image').forEach(img => img.src = imageUrl);
}


function playSong(songUri) {
    $.ajax({
      url: `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      type: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({ uris: [songUri] }),
      success: function() {
        console.log("Successfully started song playback!");
      },
      error: function(error) {
        console.error("Error initiating song playback:", error);
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
            
                document.querySelector('.song-name').textContent = songName;
                document.querySelector('.song-artist').textContent = artistName;
                document.querySelector('.song-image').src = songImage;
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
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error fetching access token:", errorThrown);
        }
    });
}

if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", function() {
    initializeLoggedInUser();
});
} else {  // DOM is already loaded
initializeLoggedInUser();
}