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

  var params = getHashParams();
  var user_id = params.user_id,
      error = params.error;

  if (error) {
    alert('There was an error during the authentication');
  } else {
    if (user_id) {
      // Use AJAX to call the serverless function, passing the user_id as a parameter
      $.ajax({
          url: '/.netlify/functions/get_user_profile',
          data: {
            user_id: user_id
          },
          success: function(response) {
            updateProfile(response);

            $('#login').hide();
            $('#loggedin').show();

            window.history.replaceState({}, document.title, "." + window.location.pathname);
          }
      });
    } else {
      // render initial screen
      $('#login').show();
      $('#loggedin').hide();
    }

    document.getElementById('login-button').addEventListener('click', function() {
      window.location = '/.netlify/functions/login';
    }, false);
  }
});