// Desktop js

document.getElementById("loading-screen").style.display = "none";
document.getElementById("loggedin").style.display = "flex";

let token;

let isVisualizerInitialized = false;
let audioCtx;
let analyzer;
let dataArray;
let bufferLength;
let canvas;
let canvasCtx;
let animationId;


window.addEventListener('resize', () => {
    if (resizeCanvasToDisplaySize(canvas)) {
        barWidth = (canvas.width / bufferLength) * 2.5;
    }
});


function resizeCanvasToDisplaySize(canvas) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;  // Indicate the size has changed
    }

    return false;  // Indicate no size change
}

function initializeVisualizer() {
    if (!player || !player._audio || !player._audio._audioElement) {
        console.warn("Waiting for the Spotify player to be ready...");
        setTimeout(initializeVisualizer, 500); // Retry after half a second
        return;
    }
    
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyzer = audioCtx.createAnalyser();
    
    player._options.getOAuthToken(token => {
        player._audio._audioElement.crossOrigin = "anonymous"; // Get audio data
        let source = audioCtx.createMediaElementSource(player._audio._audioElement);
        source.connect(analyzer);
        analyzer.connect(audioCtx.destination);
    });

    analyzer.fftSize = 256; // Number of data values you will have to play with for the visualization
    bufferLength = analyzer.frequencyBinCount; // half the FFT value
    dataArray = new Uint8Array(bufferLength); // create an array to store the data

    canvas = document.getElementById("visualizer");
    canvasCtx = canvas.getContext("2d");

    resizeCanvasToDisplaySize(canvas);
    
    drawVisualizer();
}

function drawVisualizer() {
    animationId = requestAnimationFrame(drawVisualizer);

    analyzer.getByteFrequencyData(dataArray);

    let barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;

    canvasCtx.fillStyle = `rgb(52, 252, 255)`; // Make theme color

    for (let i = 0; i < bufferLength; i++) {
        let barHeight = dataArray[i];
        canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
        x += barWidth + 1; // space between bars
    }
}


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

function displayUserLibrary(playlists) {
    const libraryDiv = document.getElementById('library');
    playlists.forEach(playlist => {
        const playlistDiv = document.createElement('div');
        playlistDiv.className = 'flex text-left gap-2 mt-2'; 

        const imageUrl = playlist.images.length > 0 ? playlist.images[0].url : 'assets/default-image.png';

        playlistDiv.innerHTML = `
            <img src="${imageUrl}" alt="Playlist Cover" class="w-12 h-12 rounded-md"> 
            <div class="flex flex-col max-w-sm truncate">
                <h1 class="text-lg truncate">${playlist.name}</h1>
                <small class="text-gray-500 truncate">${playlist.owner.display_name}</small>
            </div>
        `;
        libraryDiv.appendChild(playlistDiv);
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
                    if (animationId) {
                        cancelAnimationFrame(animationId);  // Stop the visualizer
                    }
                } else {
                    document.getElementById('playPauseCircle').src = 'assets/pauseCircle.png';
                    if (!isVisualizerInitialized) {
                        if (player && player._audio && player._audio._audioElement) {
                            initializeVisualizer();
                            isVisualizerInitialized = true;
                        } else {
                            console.error("Player or its properties are not defined. Visualizer can't be initialized.");
                        }
                    }
                    if (!animationId) {
                        drawVisualizer();
                    }
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
            
                    // Initialize the visualizer only if it hasn't been initialized before
                    if (!isVisualizerInitialized) {
                        initializeVisualizer();
                        isVisualizerInitialized = true;
                    }
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
