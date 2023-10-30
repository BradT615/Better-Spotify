# Spotify-Clone

A web-based Spotify clone built to replicate some of the core features of the popular music streaming service.

## Features

1. **User Authentication**: The application has a robust user authentication system. Users can log in, refresh their session, and even delete their user data. Check the authentication logic [here](https://github.com/BradT615/Spotify-Clone/blob/master/public/auth.js).

2. **Main Interface**: Once logged in, users are presented with a main interface where they can view their profile, playlists, and control music playback. Dive into the main interface logic [here](https://github.com/BradT615/Spotify-Clone/blob/master/public/main.js).

3. **Styling**: The application uses Tailwind CSS for styling. The main styles can be found in [output.css](https://github.com/BradT615/Spotify-Clone/blob/master/public/output.css) and [input.css](https://github.com/BradT615/Spotify-Clone/blob/master/src/input.css).

4. **Supabase Integration**: The application integrates with Supabase for backend operations. The Supabase client setup can be found [here](https://github.com/BradT615/Spotify-Clone/blob/master/utils/supabaseClient.js).

5. **Serverless Functions**: The application uses serverless functions for various operations like getting an access token, fetching user profiles, and more. Check out some of the functions:
   - [Callback](https://github.com/BradT615/Spotify-Clone/blob/master/functions/callback.js)
   - [Delete User](https://github.com/BradT615/Spotify-Clone/blob/master/functions/delete_user.js)
   - [Get Access Token](https://github.com/BradT615/Spotify-Clone/blob/master/functions/get_access_token.js)
   - [Get User Profile](https://github.com/BradT615/Spotify-Clone/blob/master/functions/get_user_profile.js)
   - [Login](https://github.com/BradT615/Spotify-Clone/blob/master/functions/login.js)
   - [Refresh Token](https://github.com/BradT615/Spotify-Clone/blob/master/functions/refresh_token.js)

## Setup

1. Clone the repository.
2. Install the required dependencies using `npm install`.
3. Set up your Supabase credentials in the `supabaseClient.js` file.
4. Run the application locally using the appropriate command (e.g., `npm start`).
