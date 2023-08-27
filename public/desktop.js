// Desktop js

document.getElementById("loading-screen").style.display = "none";
document.getElementById("loggedin").style.display = "flex";

let token;

let isPlayerReady = false;
let isVisualizerInitialized = false;
let audioCtx;
let analyzer;
let dataArray;
let bufferLength;
let canvas;
let canvasCtx;
let animationId;


function updateProfile(data) {
    let imageUrl = data.images.length > 0 ? data.images[0].url : 'assets/default-image.png';
    document.getElementById('user-name').textContent = data.display_name;
    document.querySelectorAll('.user-image').forEach(img => img.src = imageUrl);
}

function updateVolumeIcon(volumeValue) {
    const volumeLowIcon = document.getElementById('volumeLowIcon');
    const volumeMuteIcon = document.getElementById('volumeMuteIcon');
    const volumeFullIcon = document.getElementById('volumeFullIcon');

    if (volumeValue == 0) {
        volumeMuteIcon.classList.remove('hidden');
        volumeLowIcon.classList.add('hidden');
        volumeFullIcon.classList.add('hidden');
    } else if (volumeValue < 50) {
        volumeLowIcon.classList.remove('hidden');
        volumeMuteIcon.classList.add('hidden');
        volumeFullIcon.classList.add('hidden');
    } else {
        volumeFullIcon.classList.remove('hidden');
        volumeMuteIcon.classList.add('hidden');
        volumeLowIcon.classList.add('hidden');
    }
}

function setVolumeFromSlider() {
    const slider = document.getElementById('volumeSlider');
    slider.addEventListener('input', function(e) {
        let volume = e.target.value / 100; // Convert the range from 0-100 to 0-1
        if (player) {
            player.setVolume(volume).catch(error => {
                console.error("Error adjusting volume:", error);
            });
        }
        updateVolumeIcon(e.target.value);
    });
    updateVolumeIcon(slider.value);
}

let lastVolumeBeforeMute = 0.2; // default value

function muteOrRestoreVolume() {
    if (player) {
        player.getVolume().then(volume => {
            if (volume > 0) {
                lastVolumeBeforeMute = volume;
                player.setVolume(0).then(() => {
                    updateVolumeIcon(0);
                    document.getElementById('volumeSlider').value = 0;
                });
            } else {
                player.setVolume(lastVolumeBeforeMute).then(() => {
                    updateVolumeIcon(lastVolumeBeforeMute * 100);
                    document.getElementById('volumeSlider').value = lastVolumeBeforeMute * 100;
                });
            }
        }).catch(error => {
            console.error("Error getting or setting volume:", error);
        });
    }
}

document.getElementById('volumeLowIcon').addEventListener('click', muteOrRestoreVolume);
document.getElementById('volumeFullIcon').addEventListener('click', muteOrRestoreVolume);
document.getElementById('volumeMuteIcon').addEventListener('click', muteOrRestoreVolume);

function fetchUserLibrary() {
    $.ajax({
        url: 'https://api.spotify.com/v1/me/playlists',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function(response) {
            displayUserLibrary(response.items);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error fetching user playlists:", errorThrown);
        }
    });
}

let selectedPlaylistDiv = null;
let previousIcon = null;

function displayUserLibrary(playlists) {
    const libraryDiv = document.getElementById('library');
    playlists.forEach(playlist => {
        const playlistDiv = document.createElement('div');
        playlistDiv.className = 'flex justify-between items-center text-left w-full gap-2 mt-2 p-2 hover:bg-neutral-800 cursor-pointer rounded'; 

        const imageUrl = playlist.images.length > 0 ? playlist.images[0].url : 'assets/default-image.png';

        playlistDiv.innerHTML = `
            <div class="flex items-center w-full gap-2">
                <img src="${imageUrl}" alt="Playlist Cover" class="w-14 h-14 rounded-md"> 
                <div class="flex flex-col w-11/12 truncate">
                    <h1 class="text-lg truncate">${playlist.name}</h1>
                    <small class="text-gray-500 truncate">${playlist.owner.display_name}</small>
                </div>
                <box-icon class="playlist-icon hidden" name='volume-full' color='#34fcff' size='28px'></box-icon>
            </div>
        `;

        playlistDiv.addEventListener('click', () => {
            playPlaylist(playlist.id);

            // Hide all box-icons
            document.querySelectorAll('.playlist-icon').forEach(icon => {
                icon.classList.add('hidden');
            });

            // Show the box-icon for the clicked playlist
            const clickedIcon = playlistDiv.querySelector('.playlist-icon');
            clickedIcon.classList.remove('hidden');

            if (selectedPlaylistDiv) {
                selectedPlaylistDiv.classList.remove('bg-neutral-800');
            }

            playlistDiv.classList.add('bg-neutral-800');

            selectedPlaylistDiv = playlistDiv;
            previousIcon = clickedIcon;
        });

        libraryDiv.appendChild(playlistDiv);
    });
}

function playPlaylist(playlistId) {
    $.ajax({
        url: `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        type: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({ context_uri: `spotify:playlist:${playlistId}` }),
        success: function() {
            console.log("Successfully started playlist playback!");
        },
        error: function(error) {
            console.error("Error initiating playlist playback:", error);
        }
    });
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
            fetchUserLibrary();
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

                // Initialize the volume icon state
                const slider = document.getElementById('volumeSlider');
                updateVolumeIcon(slider.value);

                // Set volume from slider (and set up the event listener)
                setVolumeFromSlider();

            // Add listeners to the player
            player.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
                deviceId = device_id;
                isPlayerReady = true;

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


                let isShuffled = false;

                document.getElementById('shuffleButton').addEventListener('click', function() {
                    isShuffled = !isShuffled;  // toggle the state

                    // Update the shuffle button image based on the local state
                    document.getElementById('shuffleButton').src = isShuffled ? 'assets/shuffleActive.png' : 'assets/shuffle.png';

                    // Use the Spotify Web API to set the shuffle state
                    $.ajax({
                        url: `https://api.spotify.com/v1/me/player/shuffle?state=${isShuffled}&device_id=${deviceId}`,
                        type: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        success: function() {
                            console.log("Successfully updated shuffle state!");
                        },
                        error: function(error) {
                            console.error("Error setting shuffle state:", error);
                        }
                    });
                });


                document.getElementById('backButton').addEventListener('click', function() {
                    if (player) {
                        player.previousTrack().catch(error => {
                            console.error("Error playing previous track:", error);
                        });
                    }
                });
                
                document.getElementById('forwardButton').addEventListener('click', function() {
                    if (player) {
                        player.nextTrack().catch(error => {
                            console.error("Error playing next track:", error);
                        });
                    }
                });
                

                document.getElementById('RepeatButton').addEventListener('click', function() {
                    if (player) {
                        player.getRepeatMode().then(repeatMode => {
                            let newRepeatMode;
                            if (repeatMode === 'off') {
                                newRepeatMode = 'context';
                            } else if (repeatMode === 'context') {
                                newRepeatMode = 'track';
                            } else {
                                newRepeatMode = 'off';
                            }
                
                            player.setRepeatMode(newRepeatMode).then(() => {
                                // Update the repeat button image based on the new mode
                                if (newRepeatMode === 'off') {
                                    document.getElementById('RepeatButton').src = 'assets/repeat.png';
                                } else {
                                    document.getElementById('RepeatButton').src = 'assets/repeatActive.png';
                                }
                            }).catch(error => {
                                console.error("Error setting repeat mode:", error);
                            });
                
                        }).catch(error => {
                            console.error("Error getting repeat mode:", error);
                        });
                    }
                });

            });
            player.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
            });
            player.addListener('player_state_changed', state => {
                if (state && state.paused) {
                    document.getElementById('playPauseCircle').src = 'assets/playCircle.png';
                } else {
                    document.getElementById('playPauseCircle').src = 'assets/pauseCircle.png';
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
            
            document.getElementById('playPauseCircle').onclick = function() {
                player.togglePlay().catch(error => {
                    console.error("Error toggling playback:", error);
                });
            
                // Toggle the play/pause button image
                var currentSrc = this.src;
                if (currentSrc.includes('playCirlce.png')) {
                    this.src = 'assets/pauseCircle.png';
                } else {
                    this.src = 'assets/playCirlce.png';
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
