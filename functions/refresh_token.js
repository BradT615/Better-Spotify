const request = require('request');
const supabase = require('../utils/supabaseClient.js');
const cookie = require('cookie');

exports.handler = async (event, context) => {
  try {
    let cookies = cookie.parse(event.headers.cookie || '');
    let session_id = cookies.session_id;
    console.log('session_id in refresh_token.js:', session_id);

    const { data: user, error } = await supabase
      .from('users')
      .select('refresh_token')
      .eq('id', session_id)
      .single();

    if (error || !user) {
      console.error('Failed to retrieve user:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal Server Error: Failed to retrieve user.' })
      };
    }

    let refresh_token = user.refresh_token;

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

    return new Promise(async (resolve, reject) => {
      request.post(authOptions, async function(error, response, body) {
        if (!error && response.statusCode === 200) {
          let access_token = body.access_token;

          console.log("Received new access_token from Spotify: ", access_token);

          // Update access_token in the database
          const { error: updateError } = await supabase
            .from('users')
            .update({ access_token: access_token })
            .eq('id', session_id);

          if (updateError) {
            console.error("Error updating access_token in database:", updateError);
            reject({
              statusCode: 500,
              body: JSON.stringify({ message: 'Internal Server Error: Failed to update access_token in database.' })
            });
            return;
          }

          resolve({
            statusCode: 200,
            body: JSON.stringify({
              'message': 'Access token refreshed successfully'
            })
          });
        } else if (response.statusCode === 400 && body.error === "invalid_grant") {
          // This is the case when the refresh token is invalid (might be revoked or expired)
          console.error("Invalid refresh token, possibly user revoked access:", error);
          reject({
            statusCode: 401,  // Send a 401 status to indicate unauthorized
            body: JSON.stringify({ message: 'Unauthorized: Invalid refresh token.' })
          });
        } else {
          console.error("Error refreshing access_token from Spotify:", error);
          reject({
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error: Failed to refresh access_token.' })
          });
        }
      });
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error: Unexpected error.' })
    };
  }
};