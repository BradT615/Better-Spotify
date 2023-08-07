const request = require('request');
const supabase = require('../utils/supabaseClient.js');
const cookie = require('cookie');

exports.handler = async (event, context) => {
  let cookies = cookie.parse(event.headers.cookie || '');
  let session_id = cookies.session_id;

  // Get the user's access token from the database
  const { data: user, error } = await supabase
    .from('users')
    .select('access_token')
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
  
  let requestOptions = {
    url: 'https://api.spotify.com/v1/me',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  return new Promise(async (resolve, reject) => {
    request.get(requestOptions, async function(error, response, body) {
      if (!error && response.statusCode === 200) {
        resolve({ statusCode: 200, body: JSON.stringify(body) });
      } 
        
      console.error('Failed to retrieve user profile:', JSON.stringify(error));
      reject({ statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error: Failed to retrieve user profile.' }) });
    });
  });
};