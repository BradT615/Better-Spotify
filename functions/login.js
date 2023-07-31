const querystring = require('querystring');

let generateRandomString = function(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

exports.handler = async (event, context) => {
  let session_id = generateRandomString(16);
  console.log('session_id in login.js:', session_id);

  // your application requests authorization
  let scope = 'user-read-private user-read-email';
  let redirectUri = 'https://bradt615spotify.netlify.app/.netlify/functions/callback';
  let url = 'https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.CLIENT_ID,
      scope: scope,
      redirect_uri: redirectUri,
      state: session_id
    });

  return {
    statusCode: 302,
    headers: {
      Location: url,
      'Cache-Control': 'no-cache',
      'Set-Cookie': `session_id=${session_id}; Secure; SameSite=None`
    },
    body: JSON.stringify({})
  };
};