/**
 * Script to set up Super Admin with specific credentials
 * Email: admin@kitchenpos.com
 * Password: admin@123
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

async function setupSuperAdmin() {
  const adminEmail = 'admin@kitchenpos.com'
  const adminPassword = 'admin@123'
  const adminName = 'Super Administrator'

  try {
    console.log('🔧 Setting up Super Admin account...')

    // First, check if auth user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingAuthUser = existingUsers.users.find(u => u.email === adminEmail)

    let authUserId

    if (existingAuthUser) {
      console.log('✅ Auth user already exists, updating password...')
      
      // Update existing auth user password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingAuthUser.id,
        { 
          password: adminPassword,
          email_confirm: true
        }
      )

      if (updateError) {
        throw updateError
      }

      authUserId = existingAuthUser.id
      console.log('✅ Auth user password updated successfully')
    } else {
      console.log('🔧 Creating new auth user...')
      
      // Create new auth user
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
        throw authError
      }

      authUserId = authUser.user.id
      console.log('✅ Auth user created successfully')
    }

    // Check if database record exists
    const { data: existingDbUser, error: dbFetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .eq('role', 'super_admin')
      .single()

    if (dbFetchError && dbFetchError.code !== 'PGRST116') {
      throw dbFetchError
    }

    if (existingDbUser) {
      console.log('✅ Database user record already exists, updating auth_user_id...')
      
      // Update existing database record
      const { error: updateDbError } = await supabase
        .from('users')
        .update({ 
          auth_user_id: authUserId,
          is_active: true
        })
        .eq('id', existingDbUser.id)

      if (updateDbError) {
        throw updateDbError
      }

      console.log('✅ Database record updated successfully')
    } else {
      console.log('🔧 Creating database user record...')
      
      // Create new database record
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authUserId,
          email: adminEmail,
          full_name: adminName,
          role: 'super_admin',
          restaurant_id: null,
          is_active: true
        })

      if (insertError) {
        throw insertError
      }

      console.log('✅ Database record created successfully')
    }

    // Test login
    console.log('🧪 Testing login...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    })

    if (loginError) {
      throw new Error(`Login test failed: ${loginError.message}`)
    }

    console.log('✅ Login test successful!')
    await supabase.auth.signOut()

    console.log('\n🎉 Super Admin Setup Complete!')
    console.log('📧 Email:', adminEmail)
    console.log('🔑 Password:', adminPassword)
    console.log('🌐 You can now login at: http://localhost:5173/login')
    console.log('\n⚠️  IMPORTANT: Please change the password after first login for security!')

  } catch (error) {
    console.error('❌ Error setting up super admin:', error.message)
    console.log('\n🔧 If you encounter issues:')
    console.log('1. Make sure your Supabase environment variables are set correctly')
    console.log('2. Ensure you have the service role key (not anon key)')
    console.log('3. Check that RLS policies allow the operation')
    process.exit(1)
  }
}

// Run the script
setupSuperAdmin()