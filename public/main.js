document.addEventListener("DOMContentLoaded", function() {
  
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  function updateProfile(data) {
    let imageUrl = data.images.length > 0 ? data.images[0].url : 'assets/default-image.png';

    document.getElementById('user-name').textContent = data.display_name;
    document.querySelectorAll('.user-image').forEach(img => img.src = imageUrl);
  }

  var session_id = getCookie('session_id');

  if (session_id) {
    // Use AJAX to call the serverless function, passing the session_id as a parameter
    $.ajax({
        url: '/.netlify/functions/get_user_profile',
        headers: {
          'Cookie': `session_id=${session_id}`
        },
        success: function(response) {
          const data = JSON.parse(response); // Parse the JSON string into an object
          updateProfile(data);

          $('#login').hide();
          $('#loggedin').show();
        }
    });
  } else {
    // render initial screen
    $('#login').show();
    $('#loggedin').hide();

    document.getElementById('login-button').addEventListener('click', function() {
      window.location = '/.netlify/functions/login';
    }, false);
  }
});