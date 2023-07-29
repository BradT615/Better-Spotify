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
    request.post(authOptions, async function(error, response, body) {
      if (!error && response.statusCode === 200) {
        let access_token = body.access_token,
            refresh_token = body.refresh_token;

        // Make another request to Spotify's API to get user's profile data
        request.get({
          url: 'https://api.spotify.com/v1/me',
          headers: {
            'Authorization': 'Bearer ' + access_token
          },
          json: true
        }, async function(error, response, body) {
          if (!error && response.statusCode === 200) {
            let user_id = body.id;

            // Store the user_id, access_token, and refresh_token in Supabase
            const { error: insertError } = await supabase
              .from('users')
              .insert([
                { id: user_id, access_token: access_token, refresh_token: refresh_token },
              ]);

            if (insertError) {
                console.error('Supabase insert error:', insertError);
            } else {
                console.log('Inserted data successfully into Supabase');
            }
          } else {
            console.error('Failed to retrieve user id:', error);
          }
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