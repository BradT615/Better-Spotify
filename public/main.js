document.addEventListener("DOMContentLoaded", function() {
  
  function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  function updateProfile(data) {
    let imageUrl = data.images.length > 0 ? data.images[0].url : 'assets/default-image.png';

    document.getElementById('user-name').textContent = data.display_name;
    document.getElementById('user-image').src = imageUrl;
  }

  function updateOAuth(data) {
    document.getElementById('access-token').textContent = data.access_token;
    document.getElementById('refresh-token').textContent = data.refresh_token;
  }

  var params = getHashParams();
  var access_token = params.access_token,
      refresh_token = params.refresh_token,
      error = params.error;

  if (error) {
    alert('There was an error during the authentication');
  } else {
    if (access_token) {
      // render oauth info
      updateOAuth({
        access_token: access_token,
        refresh_token: refresh_token
      });

      $.ajax({
          url: 'https://api.spotify.com/v1/me',
          headers: {
            'Authorization': 'Bearer ' + access_token
          },
          success: function(response) {
            updateProfile(response);

            $('#login').hide();
            $('#loggedin').show();

            // Add this line to remove the parameters from the URL
            window.history.replaceState({}, document.title, "." + window.location.pathname);
          }
      });
    } else {
        // render initial screen

        $('#login').show();
        $('#loggedin').hide();

        // $('#login').hide();
        // $('#loggedin').show();

    }

    document.getElementById('login-button').addEventListener('click', function() {
      window.location = '/.netlify/functions/login'; // Updated URL
    }, false);
  }
});