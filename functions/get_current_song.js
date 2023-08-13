const request = require('request');
const supabase = require('../utils/supabaseClient.js');
const cookie = require('cookie');

exports.handler = async (event, context) => {
  let cookies = cookie.parse(event.headers.cookie || '');
  let session_id = cookies.session_id;

  const { data: user, error } = await supabase
    .from('users')
    .select('access_token')
    .eq('id', session_id)
    .single();

  if (error || !user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Authentication error.' }) };
  }

  let access_token = user.access_token;
  
  let requestOptions = {
    url: 'https://api.spotify.com/v1/me/player/currently-playing',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  return new Promise((resolve, reject) => {
    request.get(requestOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        resolve({ statusCode: 200, body: JSON.stringify(body) });
      } else if (response.statusCode === 204) {
        resolve({ statusCode: 204, body: JSON.stringify({ message: 'No content. User is not playing a song.' }) });
      } else {
        reject({ statusCode: 500, body: JSON.stringify({ message: 'Failed to retrieve current song.' }) });
      }
    });
  });  
};
