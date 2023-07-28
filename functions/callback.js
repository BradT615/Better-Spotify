const request = require('request');
const querystring = require('querystring');
const supabase = require('../utils/supabaseClient.js');

exports.handler = async (event, context) => {
  let code = event.queryStringParameters.code || null;
  let state = event.queryStringParameters.state || null;

  let redirectUri = 'https://bradt615spotify.netlify.app/.netlify/functions/callback';

  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64'))
    },
    json: true
  };

  return new Promise((resolve, reject) => {
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        let access_token = body.access_token,
            refresh_token = body.refresh_token;

        // Get the user_id from the Spotify Web API
        let user_id = body.id;

        // Store the user_id, access_token, and refresh_token in Supabase
        supabase
          .from('users')
          .insert([
            { id: user_id, access_token: access_token, refresh_token: refresh_token },
          ])
          .then(supabaseRes => {
            console.log('Supabase insert response:', supabaseRes);
          })
          .catch(supabaseErr => {
            console.error('Supabase insert error:', supabaseErr);
          });

        let uri = process.env.FRONTEND_URI || 'https://bradt615spotify.netlify.app'

        resolve({
          statusCode: 302,
          headers: {
            Location: uri + '/#' +
              querystring.stringify({
                access_token: access_token,
                refresh_token: refresh_token
              })
          },
          body: ''
        });
      } else {
        reject({
          statusCode: 500,
          body: JSON.stringify({ message: 'Internal Server Error: Failed to retrieve access token.' })
        });
      }
    });
  });
};