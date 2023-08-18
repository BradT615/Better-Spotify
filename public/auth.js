function checkUserSession(retryCount = 0) {
        $.ajax({
            url: '/.netlify/functions/get_user_profile',
            xhrFields: {
                withCredentials: true
            },
            success: function(response) {
                loadDeviceSpecificScript();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                if ((jqXHR.status === 401 || jqXHR.status === 502) && retryCount < 1) {
                    refreshTokenAndRetry();
                } else {
                    console.error("Error fetching user profile:", errorThrown);
                    window.location.href = 'login.html';
                }
            }
        });
}

function refreshTokenAndRetry(retryCount = 1) {
    if (retryCount > 3) {
        deleteUser();
        return;  
    }

    $.ajax({
        url: '/.netlify/functions/refresh_token',
        xhrFields: {
            withCredentials: true
        },
        success: function(response) {
            checkUserSession(retryCount);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            if (jqXHR.status === 401 || jqXHR.status === 502) {
                console.error("User possibly revoked access or there was an error refreshing the token.");
                deleteUser();
            } else {
                refreshTokenAndRetry(retryCount + 1);
            }
        }
    });
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
            window.location.href = 'login.html';
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Failed to delete user data:", errorThrown);
        }
    });
}

checkUserSession();



function loadDeviceSpecificScript() {
    // Load Spotify SDK
    const spotifyScript = document.createElement('script');
    spotifyScript.src = 'https://sdk.scdn.co/spotify-player.js';
    document.body.appendChild(spotifyScript);

    // Load the device-specific script
    let scriptFile = window.innerWidth <= 640 ? "mobile.js" : "desktop.js";
    let script = document.createElement('script');
    script.src = scriptFile;
    script.defer = true;
    document.head.appendChild(script);
}