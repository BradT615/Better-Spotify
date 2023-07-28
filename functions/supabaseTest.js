import supabase from './utils/supabaseClient.js'

async function testSupabase() {
    const { data, error } = await supabase
        .from('users')
        .select('*')

    if (error) {
        console.log('Error fetching data: ', error);
    } else {
        console.log('Data fetched successfully: ', data);
    }
}

testSupabase();