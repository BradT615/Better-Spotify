document.addEventListener("DOMContentLoaded", function() {
  function oauthTemplate(data) {
    return `
      <h2>OAuth Info</h2>
      <dl class="dl-horizontal">
          <dt>Access token</dt><dd class="clearfix">${data.access_token}</dd>
          <dt>Refresh token</dt><dd>${data.refresh_token}</dd>
      </dl>
    `;
  }

  function userProfileTemplate(data) {
    let imageUrl = data.images.length > 0 ? data.images[0].url : 'default-image.jpg';
    
    return `
      <div class="flex flex-col justify-center bg-white p-4 rounded-lg shadow-md">
          <h1 class="text-2xl font-bold mb-2">Logged in as ${data.display_name}</h1>
          <img class="w-24 h-24 rounded-full mb-2" src="${imageUrl}" alt="${data.display_name}'s profile image" />
          <p class="text-blue-500">${data.email}</p>
          <p class="mt-2">${data.country}</p>
      </div>
    `;
  }

  function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  var params = getHashParams();
  var access_token = params.access_token,
      refresh_token = params.refresh_token,
      error = params.error;

  var oauthPlaceholder = document.getElementById('oauth-placeholder');
  var userProfilePlaceholder = document.getElementById('user-profile');

  if (error) {
    alert('There was an error during the authentication');
  } else {
    if (access_token) {
      // render oauth info
      oauthPlaceholder.innerHTML = oauthTemplate({
        access_token: access_token,
        refresh_token: refresh_token
      });

      $.ajax({
          url: 'https://api.spotify.com/v1/me',
          headers: {
            'Authorization': 'Bearer ' + access_token
          },
          success: function(response) {
            userProfilePlaceholder.innerHTML = userProfileTemplate(response);

            $('#login').hide();
            $('#loggedin').show();
          }
      });
    } else {
        // render initial screen
        $('#login').show();
        $('#loggedin').hide();
    }

    document.getElementById('obtain-new-token').addEventListener('click', function() {
      $.ajax({
        url: '/.netlify/functions/refresh_token',
        data: {
          'refresh_token': refresh_token
        }
      }).done(function(data) {
        // Parse the returned data
        data = JSON.parse(data);
    
        if (data.access_token) {
          access_token = data.access_token;
          oauthPlaceholder.innerHTML = oauthTemplate({
            access_token: access_token,
            refresh_token: refresh_token
          });
        } else {
          console.error('Failed to refresh access token. Data:', data);
        }
      }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error('Ajax request failed. Status:', textStatus, 'Error:', errorThrown);
      });
    }, false);           

    document.getElementById('login-button').addEventListener('click', function() {
      window.location = '/.netlify/functions/login'; // Updated URL
    }, false);
  }
});