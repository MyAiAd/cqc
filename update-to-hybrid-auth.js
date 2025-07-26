#!/usr/bin/env node

/**
 * Update Script: Switch to Hybrid Authentication
 * 
 * This script helps you switch from magic-link-only authentication
 * to the hybrid system that supports both magic links and passwords.
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Updating to Hybrid Authentication System...');

// Update App.tsx to use EnhancedLoginForm
const appPath = path.join(__dirname, 'src', 'App.tsx');

if (fs.existsSync(appPath)) {
  let appContent = fs.readFileSync(appPath, 'utf8');
  
  // Replace the import
  if (appContent.includes("import { LoginForm } from './components/auth/LoginForm';")) {
    appContent = appContent.replace(
      "import { LoginForm } from './components/auth/LoginForm';",
      "import { EnhancedLoginForm } from './components/auth/EnhancedLoginForm';"
    );
    
    // Replace the component usage
    appContent = appContent.replace(
      '<LoginForm />',
      '<EnhancedLoginForm />'
    );
    
    fs.writeFileSync(appPath, appContent);
    console.log('✅ Updated App.tsx to use EnhancedLoginForm');
  } else {
    console.log('ℹ️  App.tsx already updated or uses different structure');
  }
} else {
  console.log('❌ App.tsx not found at expected location');
}

console.log('\n🎉 Hybrid Authentication Setup Complete!');
console.log('\n📋 Next Steps:');
console.log('1. Test magic link authentication (recommended)');
console.log('2. Test password authentication for admin users:');
console.log('   - Sage: sage@myai.ad (password: T3sla12e!)');
console.log('   - Daniel: daniel@hcqc.co.uk (password: mJtXkqWmChC5)');
console.log('3. Users will see a toggle between "Magic Link" and "Password" options');
console.log('4. Magic links remain the default and recommended option');
console.log('\n📖 See HYBRID_AUTH_SETUP_GUIDE.md for detailed documentation'); 