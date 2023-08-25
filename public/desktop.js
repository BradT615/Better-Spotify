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

function displayUserLibrary(playlists) {
    const libraryDiv = document.getElementById('library');
    playlists.forEach(playlist => {
        const playlistDiv = document.createElement('div');
        playlistDiv.className = 'flex text-left gap-2 mt-2 p-2 hover:bg-neutral-800 cursor-pointer rounded'; 

        const imageUrl = playlist.images.length > 0 ? playlist.images[0].url : 'assets/default-image.png';

        playlistDiv.innerHTML = `
            <img src="${imageUrl}" alt="Playlist Cover" class="w-12 h-12 rounded-md"> 
            <div class="flex flex-col max-w-sm truncate">
                <h1 class="text-lg truncate">${playlist.name}</h1>
                <small class="text-gray-500 truncate">${playlist.owner.display_name}</small>
            </div>
        `;

        playlistDiv.addEventListener('click', () => {
            playPlaylist(playlist.id);

            if (selectedPlaylistDiv) {
                selectedPlaylistDiv.classList.remove('bg-neutral-800');
            }

            playlistDiv.classList.add('bg-neutral-800');

            selectedPlaylistDiv = playlistDiv;
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


const mockPlaylists = [
    {
        name: "Ed's Hits",
        owner: { display_name: "John Doe" },
        images: [{ url: "https://i.scdn.co/image/ab67616d0000485182b243023b937fd579a35533" }]
    },
    {
        name: "Billie's Ballads",
        owner: { display_name: "Jane Smith" },
        images: [{ url: "https://i.scdn.co/image/ab67616d0000485197b3b4d69a0e254c3f3f1466" }]
    },
    {
        name: "Weekend Vibes",
        owner: { display_name: "Alice" },
        images: [{ url: "https://i.scdn.co/image/ab67616d00004851e727b4e450ba24cc5163de4e" }]
    },
    {
        name: "Retro Tunes",
        owner: { display_name: "Bob" },
        images: [{ url: "https://i.scdn.co/image/ab67616d00004851f7db43292a6a99b21b51d5b4" }]
    },
    {
        name: "Heartbreak Anthems fnjsdflsdn",
        owner: { display_name: "Charlie" },
        images: [{ url: "https://i.scdn.co/image/ab67616d00004851f4631e319f6f7e1f7b65a8e0" }]
    },
    {
        name: "Retro Tunes",
        owner: { display_name: "Bob" },
        images: [{ url: "https://i.scdn.co/image/ab67616d00004851f7db43292a6a99b21b51d5b4" }]
    },
    {
        name: "Heartbreak Anthems",
        owner: { display_name: "Charlie" },
        images: [{ url: "https://i.scdn.co/image/ab67616d00004851f4631e319f6f7e1f7b65a8e0" }]
    },
    {
        name: "Retro Tunes",
        owner: { display_name: "Bob" },
        images: [{ url: "https://i.scdn.co/image/ab67616d00004851f7db43292a6a99b21b51d5b4" }]
    },
    {
        name: "Retro Tunes",
        owner: { display_name: "Bob" },
        images: [{ url: "https://i.scdn.co/image/ab67616d00004851f7db43292a6a99b21b51d5b4" }]
    },
    {
        name: "Retro Tunes",
        owner: { display_name: "Bob" },
        images: [{ url: "https://i.scdn.co/image/ab67616d00004851f7db43292a6a99b21b51d5b4" }]
    },
    {
        name: "Retro Tunes",
        owner: { display_name: "Bob" },
        images: [{ url: "https://i.scdn.co/image/ab67616d00004851f7db43292a6a99b21b51d5b4" }]
    },
    {
        name: "Retro Tunes",
        owner: { display_name: "Bob" },
        images: [{ url: "https://i.scdn.co/image/ab67616d00004851f7db43292a6a99b21b51d5b4" }]
    },
];

displayUserLibrary(mockPlaylists);