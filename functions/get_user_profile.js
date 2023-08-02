const request = require('request');
const supabase = require('../utils/supabaseClient.js');
const cookie = require('cookie');

async function refreshAccessToken(session_id, refresh_token) {
  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64'))
    },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  try {
    let body = await request.post(authOptions);
    let new_access_token = body.access_token;

    if (new_access_token) {
      // Update access_token in the database
      await supabase
        .from('users')
        .update({ access_token: new_access_token })
        .eq('id', session_id);
    }

    return new_access_token;
  } catch (error) {
    console.error('Failed to refresh access token:', JSON.stringify(error));
    
    // Delete the user's record from the database
    await supabase
      .from('users')
      .delete()
      .eq('id', session_id);

    return null;
  }
}

exports.handler = async (event, context) => {
  // Parse the session_id from the cookies in the incoming request
  let cookies = cookie.parse(event.headers.cookie || '');
  let session_id = cookies.session_id;

  // Get the user's access token and refresh token from the database
  const { data: user, error } = await supabase
    .from('users')
    .select('access_token, refresh_token')
    .eq('id', session_id)
    .single();

  if (error || !user) {
    console.error('Failed to retrieve user:', JSON.stringify(error));
    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': 'https://bradt615spotify.netlify.app',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify({ error: 'Authentication error.' })
    };
  }

  let access_token = user.access_token;
  let refresh_token = user.refresh_token;
  let requestOptions = {
    url: 'https://api.spotify.com/v1/me',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  return new Promise(async (resolve, reject) => {
    request.get(requestOptions, async function(error, response, body) {
      if (!error && response.statusCode === 200) {
        resolve({ statusCode: 200, body: JSON.stringify(body) });
      } else {
        if (response && response.statusCode === 401) {
          // Refresh the access token
          let new_access_token = await refreshAccessToken(session_id, refresh_token);
          if (new_access_token) {
            // Retry the request with the new access token
            requestOptions.headers['Authorization'] = 'Bearer ' + new_access_token;
            request.get(requestOptions, async function(error, response, body) {
              if (!error && response.statusCode === 200) {
                resolve({ statusCode: 200, body: JSON.stringify(body) });
              } else {
                console.error('Failed to retrieve user profile after token refresh:', JSON.stringify(error));
                reject({ statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error: Failed to retrieve user profile.' }) });
              }
            });
          } else {
            console.error('Failed to refresh access token:', JSON.stringify(error));
            reject({ statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error: Failed to retrieve user profile.' }) });
          }
        } else {
          console.error('Failed to retrieve user profile:', JSON.stringify(error));
          reject({ statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error: Failed to retrieve user profile.' }) });
        }
      }
    });
  });
};