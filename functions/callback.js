const request = require('request-promise');
const querystring = require('querystring');
const supabase = require('../utils/supabaseClient.js');
const cookie = require('cookie');

exports.handler = async (event, context) => {
  let code = event.queryStringParameters.code || null;
  let state = event.queryStringParameters.state || null;

  let cookies = cookie.parse(event.headers.cookie || '');
  let session_id = cookies.session_id;
  console.log('session_id in callback.js:', session_id);

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

  console.log('About to send request for access token...');

  try {
    let body = await request.post(authOptions);
    let access_token = body.access_token,
        refresh_token = body.refresh_token;

    // Store the session_id, access_token, and refresh_token in Supabase
    await supabase
      .from('users')
      .insert([
        { id: session_id, access_token: access_token, refresh_token: refresh_token },
      ], { upsert: true })
      .then(supabaseRes => {
        console.log('Supabase insert response:', supabaseRes);
      })
      .catch(supabaseErr => {
        console.error('Supabase insert error:', supabaseErr);
      });

    let uri = process.env.FRONTEND_URI || 'https://bradt615spotify.netlify.app'

    console.log('Finished handling callback.');

    return {
      statusCode: 302,
      headers: {
        Location: uri,
        'Set-Cookie': `session_id=${session_id}; Secure; HttpOnly; SameSite=None`
      },
      body: ''
    };
  } 
  catch (error) {
    console.error('Failed to get access token:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error: Failed to retrieve access token.' })
    };
  }
};