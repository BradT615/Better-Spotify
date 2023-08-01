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

  function checkSessionId() {
    // No need to get session_id from cookie here because it's HTTP-only
  
    // Use AJAX to call the serverless function
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
        
      },
      error: function(jqXHR, textStatus, errorThrown) {
        // If the AJAX call fails, it means the user is not logged in
        console.error('AJAX error:', textStatus, ', Details:', errorThrown);
        console.error('Response:', jqXHR.responseText);
        console.error('Error object:', jqXHR);

        // delete any possible cookies
        document.cookie = "session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        
        $('#login').show();
        $('#loggedin').hide();
      }
    });
  }

  // Check session_id when page is loaded
  checkSessionId();

  // Also check session_id when login button is clicked
  document.getElementById('login-button').addEventListener('click', function() {
    window.location = '/.netlify/functions/login';
    // Check session_id again after a delay to give the login function time to complete
    setTimeout(checkSessionId, 2000);  // Adjust delay as needed
  }, false);
});
