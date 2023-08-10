document.addEventListener("DOMContentLoaded", function() {

  function updateProfile(data) {
    let imageUrl = data.images.length > 0 ? data.images[0].url : 'assets/default-image.png';
    document.getElementById('user-name').textContent = data.display_name;
    document.querySelectorAll('.user-image').forEach(img => img.src = imageUrl);
  }

  function updateUserState(isLoggedIn, data = null) {
    if (isLoggedIn) {
      updateProfile(data);
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
            // Clear frontend data or state
            document.cookie = "session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            // Clear local storage?
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Failed to delete user data:", errorThrown);
        }
    });
  }

  function refreshTokenAndRetry(retryCount = 1) {
    if (retryCount > 3) { // Limit to 3 retries
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
            // Handle data deletion and UI update.
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

  checkUserSession();

  document.getElementById('login-button').addEventListener('click', function() {
    window.location = '/.netlify/functions/login';
  });
  
});