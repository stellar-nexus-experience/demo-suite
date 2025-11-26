#!/usr/bin/env node

/**
 * Script to check Firebase environment variables
 * Helps verify which variables are set locally vs what needs to be in Vercel
 */

const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
];

console.log('🔍 Checking Firebase Environment Variables\n');
console.log('='.repeat(60));

let allSet = true;
const results = [];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isSet = !!value && value.trim() !== '';
  const isPlaceholder =
    value && (value.includes('placeholder') || value.includes('your_') || value === '');

  if (!isSet || isPlaceholder) {
    allSet = false;
    results.push(`❌ ${varName}: ${isSet ? 'Placeholder value' : 'NOT SET'}`);
  } else {
    // Show first and last few chars for security
    const masked =
      value.length > 10 ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : '***';
    results.push(`✅ ${varName}: ${masked}`);
  }
});

results.forEach(r => console.log(r));

console.log('\n' + '='.repeat(60));

if (allSet) {
  console.log('\n✅ All Firebase environment variables are set!');
  console.log('\n📝 Next steps for Vercel:');
  console.log('   1. Go to your Vercel project dashboard');
  console.log('   2. Navigate to Settings → Environment Variables');
  console.log('   3. Add each of the variables above');
  console.log('   4. Set them for: Production, Preview, and Development');
  console.log('   5. Redeploy your project');
} else {
  console.log('\n⚠️  Some Firebase environment variables are missing or have placeholder values!');
  console.log('\n📝 To fix:');
  console.log('   1. Create a .env.local file in your project root');
  console.log('   2. Add all the variables from env.example');
  console.log('   3. Fill in your actual Firebase values');
  console.log('   4. Then set them in Vercel (see steps above)');
}

console.log('\n💡 Remember: .env files are LOCAL ONLY and not uploaded to Vercel!');
console.log('   You must manually set environment variables in Vercel dashboard.\n');

process.exit(allSet ? 0 : 1);
