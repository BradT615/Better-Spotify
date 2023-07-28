// supabaseClient.js
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://bvtdkhtwvsgaribkxnez.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dGRraHR3dnNnYXJpYmt4bmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk0NjU5MzQsImV4cCI6MjAwNTA0MTkzNH0.ksz6ZvPpzhgFuj1qAHMlaw7Jntjv2u5gaxQN9__aqLo'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

module.exports = supabase