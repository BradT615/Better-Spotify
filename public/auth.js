function checkUserSession(retryCount = 0) {
  fetch('/.netlify/functions/get_user_profile', {
    credentials: 'include'
  })
    .then(response => {
      if (response.ok) {
        loadDeviceSpecificScript();
      } else if ((response.status === 401 || response.status === 502) && retryCount < 1) {
        refreshTokenAndRetry();
      } else {
        throw new Error('Error fetching user profile');
      }
    })
    .catch(error => {
      console.error(error);
      redirectToLogin();
    });
}

function refreshTokenAndRetry(retryCount = 1) {
  if (retryCount > 3) {
    deleteUser();
    return;
  }
  
  fetch('/.netlify/functions/refresh_token', {
    credentials: 'include'
  })
    .then(response => {
      if (response.ok) {
        checkUserSession(retryCount);
      } else if (response.status === 401 || response.status === 502) {
        console.error("User possibly revoked access or there was an error refreshing the token.");
        deleteUser();
      } else {
        throw new Error('Error refreshing token');
      }
    })
    .catch(() => {
      refreshTokenAndRetry(retryCount + 1);
    });
}

function deleteUser() {
  fetch('/.netlify/functions/delete_user', {
    method: 'DELETE',
    credentials: 'include'
  })
    .then(response => {
      if (response.ok) {
        console.log("User data deleted successfully.");
      } else {
        console.error("Failed to delete user data.");
      }
    })
    .catch(error => {
      console.error("Failed to delete user data:", error);
    })
    .finally(() => {
      redirectToLogin();
    });
}

function redirectToLogin() {
  window.location.href = 'login.html';
}

function loadDeviceSpecificScript() {
  // Load Spotify SDK
  const spotifyScript = document.createElement('script');
  spotifyScript.src = 'https://sdk.scdn.co/spotify-player.js';
  document.body.appendChild(spotifyScript);

  // Load the device-specific script
  const scriptFile = window.innerWidth <= 640 ? "mobile.js" : "desktop.js";
  const script = document.createElement('script');
  script.src = scriptFile;
  script.defer = true;
  document.head.appendChild(script);
}

checkUserSession();