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

  function checkUserSession() {
    $.ajax({
      url: '/.netlify/functions/get_user_profile',
      xhrFields: {
        withCredentials: true
      },
      success: function(response) {
        const data = JSON.parse(response);
        updateUserState(true, data);
      },
      error: function() {
        updateUserState(false);
      }
    });
  }

  // Check user session when page is loaded
  checkUserSession();

  // Also check user session when login button is clicked
  document.getElementById('login-button').addEventListener('click', function() {
    window.location = '/.netlify/functions/login';
    setTimeout(checkUserSession, 2000);
  }, false);
});