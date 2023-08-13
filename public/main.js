document.addEventListener("DOMContentLoaded", function() {

  function updateProfile(data) {
    let imageUrl = data.images.length > 0 ? data.images[0].url : 'assets/default-image.png';
    document.getElementById('user-name').textContent = data.display_name;
    document.querySelectorAll('.user-image').forEach(img => img.src = imageUrl);
  }

  function updateUserState(isLoggedIn, data = null) {
    if (isLoggedIn) {
      updateProfile(data);
      initializeLoggedInUser();
      document.getElementById('login').style.display = 'none';
      document.getElementById('loggedin').style.display = 'flex';
    } else {
      document.getElementById('login').style.display = 'flex';
      document.getElementById('loggedin').style.display = 'none';
    }
  }
  
  // Manually trigger the logged-in state for local development
  // updateUserState(true);
  




  function deleteUser() {
    $.ajax({
        url: '/.netlify/functions/delete_user',
        type: 'DELETE',
        xhrFields: {
            withCredentials: true
        },
        success: function(response) {
            console.log("User data deleted successfully.");
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Failed to delete user data:", errorThrown);
        }
    });
  }

  function refreshTokenAndRetry(retryCount = 1) {
    if (retryCount > 3) {
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

  function initializeLoggedInUser() {
    function toggleDropdown() {
      var dropdown = document.querySelector('.dropdown-menu');
      dropdown.classList.toggle('hidden');
    }

    var dropdown = document.querySelector('.dropdown-menu');
    var userMenu = document.getElementById('user-menu');

    document.querySelector('.user-image').addEventListener('click', function() {
      dropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', function(event) {
      if (!userMenu.contains(event.target)) {
        dropdown.classList.add('hidden');
      }
    });

    userMenu.addEventListener('click', function(event) {
      event.stopPropagation();
    });

    var selectedColor = 'sky';
    var accentColor = 'bg-sky-400';

    function updateThemeColor() {
      document.querySelectorAll('.theme-color').forEach(function(element) {
        element.classList.remove(accentColor);
        element.classList.add('bg-' + selectedColor + '-400');
      });
      accentColor = 'bg-' + selectedColor + '-400';
    }

    updateThemeColor();

    document.querySelectorAll('.color-circle').forEach(function(circle) {
      circle.addEventListener('click', function() {
        document.querySelectorAll('.color-circle').forEach(function(c) {
          c.classList.remove('active');
        });
        circle.classList.add('active');
        selectedColor = circle.dataset.color;
        updateThemeColor();
      });
    });

    document.getElementById('logout-button').addEventListener('click', function() {
      deleteUser();
      updateUserState(false);
    });








    function getCurrentSong() {
      $.ajax({
        url: '/.netlify/functions/get_current_song',
        xhrFields: {
          withCredentials: true
        },
        success: function(response) {
          const data = typeof response === 'string' ? JSON.parse(response) : response;
          updateSongCard(data);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.error("Error fetching current song:", errorThrown);
        }
      });
    }
    
    function updateSongCard(data) {
      const songName = data.item.name;
      const artistName = data.item.artists[0].name;
      const songImage = data.item.album.images[0].url;
    
      document.querySelector('.songCard h1.truncate').textContent = songName;
      document.querySelector('.songCard h1.truncate + h1').textContent = artistName;
      document.querySelector('.songCard img').src = songImage;
    }
    
    // Call the getCurrentSong function periodically to keep the song card updated
    setInterval(getCurrentSong, 5000);
    








    document.getElementById('playPauseButton').addEventListener('click', function() {
      var button = document.getElementById('playPauseButton');
      if (button.src.endsWith('play.png')) {
        button.src = 'assets/pause.png';
        button.alt = 'Pause Button';
      } else {
        button.src = 'assets/play.png';
        button.alt = 'Play Button';
      }
    });
  }

  document.getElementById('login-button').addEventListener('click', function() {
    window.location = '/.netlify/functions/login';
  });

});
