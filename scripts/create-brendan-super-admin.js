/**
 * Script to create Brendan as super admin user
 */

import { createClient } from '@supabase/supabase-js'

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createBrendanSuperAdmin() {
  const adminEmail = 'brendan@teqmavens.com'
  const adminPassword = 'admin@123'
  const adminName = 'Brendan TeqMavens'

  try {
    console.log('🔧 Creating super admin user for Brendan...')

    // 1. Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminName,
        role: 'super_admin'
      }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  Auth user already exists, checking database record...')
        
        // Get existing auth user
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingUser = existingUsers.users.find(u => u.email === adminEmail)
        
        if (existingUser) {
          // Check if database record exists
          const { data: dbUser, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('email', adminEmail)
            .eq('role', 'super_admin')
            .single()

          if (dbError && dbError.code === 'PGRST116') {
            // Database record doesn't exist, create it
            console.log('📝 Creating database record for existing auth user...')
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                auth_user_id: existingUser.id,
                email: adminEmail,
                full_name: adminName,
                role: 'super_admin',
                restaurant_id: null,
                is_active: true
              })

            if (insertError) {
              throw insertError
            }

            console.log('✅ Super admin database record created successfully!')
          } else if (!dbError) {
            console.log('✅ Super admin already exists in database')
          } else {
            throw dbError
          }
        }
      } else {
        throw authError
      }
    } else {
      console.log('✅ Auth user created successfully')

      // 2. Create database record
      console.log('📝 Creating database record...')
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authUser.user.id,
          email: adminEmail,
          full_name: adminName,
          role: 'super_admin',
          restaurant_id: null,
          is_active: true
        })

      if (dbError) {
        throw dbError
      }

      console.log('✅ Super admin database record created successfully!')
    }

    // 3. Test login
    console.log('🧪 Testing login...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    })

    if (loginError) {
      console.log('❌ Login test failed:', loginError.message)
      console.log('⚠️  You may need to check the user in Supabase Dashboard')
    } else {
      console.log('✅ Login test successful!')
      await supabase.auth.signOut()
    }

    console.log('\n🎉 Brendan Super Admin Setup Complete!')
    console.log('📧 Email:', adminEmail)
    console.log('🔑 Password:', adminPassword)
    console.log('🌐 You can now login at: http://localhost:5173/login')

  } catch (error) {
    console.error('❌ Error creating super admin:', error.message)
    
    if (error.message.includes('RLS')) {
      console.log('\n🔧 RLS Policy Issue Detected:')
      console.log('This might be due to Row Level Security policies.')
      console.log('The auth user was likely created, but the database record might have failed.')
      console.log('Try logging in anyway - the auth middleware might handle it.')
    }
    
    process.exit(1)
  }
}

// Run the script
createBrendanSuperAdmin()