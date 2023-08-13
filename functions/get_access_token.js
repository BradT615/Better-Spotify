const supabase = require('../utils/supabaseClient.js');
const cookie = require('cookie');

exports.handler = async (event, context) => {
  let cookies = cookie.parse(event.headers.cookie || '');
  let session_id = cookies.session_id;

  console.log("Parsed cookies:", cookies); // Log the parsed cookies
  console.log("Session ID:", session_id);   // Log the extracted session_id

  // Get the user's access token from the database
  const { data: user, error } = await supabase
    .from('users')
    .select('access_token')
    .eq('id', session_id)
    .single();

  if (user) {
    console.log("User retrieved:", user); // Log the retrieved user object
  }

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

  console.log("Access Token:", access_token); // Log the extracted access token

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://bradt615spotify.netlify.app',
      'Access-Control-Allow-Credentials': 'true'
    },
    body: JSON.stringify({ access_token: access_token })
  };
};
