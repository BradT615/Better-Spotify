document.addEventListener("DOMContentLoaded", function() {

  function updateProfile(data) {
    let imageUrl = data.images.length > 0 ? data.images[0].url : 'assets/default-image.png';
    document.getElementById('user-name').textContent = data.display_name;
    document.querySelectorAll('.user-image').forEach(img => img.src = imageUrl);
  }

  function updateUserState(isLoggedIn, data = null) {
    if (isLoggedIn) {
      updateProfile(data);
      $('#login').hide();
      $('#loggedin').show();
    } else {
      $('#login').show();
      $('#loggedin').hide();
    }
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
      error: function() {
        refreshTokenAndRetry(retryCount + 1);
      }
    });
  }

  function checkUserSession() {
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
        if (jqXHR.status === 401) {
          refreshTokenAndRetry();
        } else {
          updateUserState(false);
          console.error("Error fetching user profile:", errorThrown); // Log the error
        }
      }
    });
  }

  checkUserSession(); // Check user session when page is loaded

  document.getElementById('login-button').addEventListener('click', function() {
    window.location = '/.netlify/functions/login';
  });

  document.getElementById('check-session-button').addEventListener('click', function() {
    checkUserSession();
  });

});