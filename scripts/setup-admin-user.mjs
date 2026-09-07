#!/usr/bin/env node
/**
 * Setup Admin User for Phoenix Assessment App
 * 
 * Usage:
 *   node scripts/setup-admin-user.mjs
 * 
 * This script creates or updates an admin user in Supabase. Supply the
 * credentials at runtime through ADMIN_EMAIL and ADMIN_PASSWORD; never commit
 * them to the repository.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Missing environment variables:');
  console.error('   - VITE_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  console.error('   - ADMIN_EMAIL:', ADMIN_EMAIL ? '✓' : '✗');
  console.error('   - ADMIN_PASSWORD:', ADMIN_PASSWORD ? '✓' : '✗');
  console.error('\n📝 Provide the admin credentials only through your local environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupAdminUser() {
  console.log('🔧 Setting up admin user...\n');

  const email = ADMIN_EMAIL;
  const password = ADMIN_PASSWORD;

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    if (existingUser) {
      console.log(`✓ User ${email} already exists (ID: ${existingUser.id})`);
      console.log('  Updating role to admin...\n');

      const { data, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          app_metadata: {
            role: 'admin',
          },
          email_confirm: true,
        }
      );

      if (updateError) {
        console.error('❌ Failed to update user:', updateError.message);
        process.exit(1);
      }

      console.log('✓ User role updated to admin');
      console.log('\n✅ Admin user role is ready.');
      console.log(`\n🚀 Login at: http://localhost:5173/login`);
      return;
    }

    // Create new user
    console.log(`📧 Creating user: ${email}`);
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        role: 'admin',
      },
    });

    if (signUpError) {
      console.error('❌ Failed to create user:', signUpError.message);
      process.exit(1);
    }

    console.log(`✓ User created successfully (ID: ${signUpData.user.id})`);
    console.log(`✓ Email verified: true`);
    console.log(`✓ Role: admin`);

    console.log('\n✅ Admin user setup complete.');
    console.log(`\n🚀 Login at: http://localhost:5173/login`);
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

setupAdminUser();
