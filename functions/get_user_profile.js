const request = require('request');
const supabase = require('../utils/supabaseClient.js');
const cookie = require('cookie');

exports.handler = async (event, context) => {
  // Parse the session_id from the cookies in the incoming request
  let cookies = cookie.parse(event.headers.cookie || '');
  let session_id = cookies.session_id;
  console.log('session_id in get_user_profile.js:', session_id);

  // Get the user's access token from the database
  const { data: user, error } = await supabase
    .from('users')
    .select('access_token')
    .eq('id', session_id)
    .single();

  if (error || !user) {
    console.error('Failed to retrieve user:', error);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://bradt615spotify.netlify.app',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify(data)
    };
  }

  let access_token = user.access_token;

  let requestOptions = {
    url: 'https://api.spotify.com/v1/me',
    headers: {
      'Authorization': 'Bearer ' + access_token
    },
    json: true
  };

  return new Promise((resolve, reject) => {
    request.get(requestOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        resolve({
          statusCode: 200,
          body: JSON.stringify(body)
        });
      } else if (response.statusCode === 401) {
        // Remove user session from the database
        supabase
          .from('users')
          .delete()
          .eq('id', session_id)
          .then(supabaseRes => {
            console.log('Supabase delete response:', supabaseRes);
          })
          .catch(supabaseErr => {
            console.error('Supabase delete error:', supabaseErr);
          });

        reject({
          statusCode: 401,
          body: JSON.stringify({ message: 'Unauthorized: Invalid or expired access token.' })
        });
      } else {
        reject({
          statusCode: 500,
          body: JSON.stringify({ message: 'Internal Server Error: Failed to retrieve user profile.' })
        });
      }
    });
  });
};
