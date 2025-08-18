/**
 * Test de conexión a Supabase
 * Ejecutar con: node test-supabase-connection.js
 */

// Cargamos las variables de entorno
require('dotenv').config({ path: './mindhub/frontend/.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔧 Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT FOUND')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('\n🔌 Testing database connection...')
    
    // Test 1: Basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table not found (okay for now)
      console.error('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Database connection successful!')
    
    // Test 2: Auth connection
    console.log('\n🔐 Testing auth connection...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError && authError.message !== 'Auth session missing!') {
      console.error('❌ Auth connection failed:', authError.message)
      return false
    }
    
    console.log('✅ Auth connection successful!')
    console.log('Current user:', user ? user.email : 'Not logged in')
    
    return true
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    return false
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Supabase connection test completed successfully!')
    console.log('✅ Ready to continue with migration')
  } else {
    console.log('\n❌ Connection test failed')
    console.log('🔧 Check your environment variables and Supabase configuration')
  }
  process.exit(success ? 0 : 1)
})