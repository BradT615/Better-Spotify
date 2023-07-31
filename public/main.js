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
  console.log('session_id in main.js:', session_id);

  if (session_id) {
    // Use AJAX to call the serverless function, passing the session_id as a parameter
    $.ajax({
      url: '/.netlify/functions/get_user_profile',
      xhrFields: {
        withCredentials: true
      },
      success: function(response) {
        const data = JSON.parse(response); // Parse the JSON string into an object
        updateProfile(data);
      
        $('#login').hide();
        $('#loggedin').show();
    
        // Log the session_id here
        var session_id_after_ajax = getCookie('session_id');
        console.log('session_id after AJAX:', session_id_after_ajax);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.error('AJAX error:', textStatus, ', Details:', errorThrown);
        console.error('Response:', jqXHR.responseText);
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