#!/usr/bin/env node

/**
 * Script to get Zoho OAuth Refresh Token
 * Run this after getting the authorization code
 */

const https = require('https');
const querystring = require('querystring');

// Your Zoho OAuth credentials
const CLIENT_ID = '1000.7G88ZWPZKVWDWO3W4QPSTPGFI2OVOH';
const CLIENT_SECRET = '00f06318481924e117c7ad10e90197f26a8e42c942';
const REDIRECT_URI = 'https://mindhub.cloud/api/auth/zoho/callback';

// Get the authorization code from command line
const authCode = process.argv[2];

if (!authCode) {
  console.log('❌ Please provide the authorization code as an argument');
  console.log('Usage: node setup-zoho-oauth.js YOUR_AUTH_CODE');
  console.log('\nTo get the auth code, visit this URL in your browser:');
  console.log(`https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=${CLIENT_ID}&scope=ZohoMail.messages.CREATE,ZohoMail.accounts.READ&redirect_uri=${REDIRECT_URI}&access_type=offline`);
  process.exit(1);
}

// Prepare the token request
const tokenData = querystring.stringify({
  grant_type: 'authorization_code',
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
  redirect_uri: REDIRECT_URI,
  code: authCode
});

const options = {
  hostname: 'accounts.zoho.com',
  port: 443,
  path: '/oauth/v2/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': tokenData.length
  }
};

console.log('🔄 Requesting tokens from Zoho...');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.error) {
        console.error('❌ Error from Zoho:', response.error);
        console.error('Description:', response.error_description);
        return;
      }

      console.log('\n✅ SUCCESS! Here are your tokens:\n');
      console.log('Access Token:', response.access_token);
      console.log('Refresh Token:', response.refresh_token);
      console.log('Expires in:', response.expires_in, 'seconds');
      
      console.log('\n📝 Add these to your .env file:\n');
      console.log('ZOHO_CLIENT_ID=' + CLIENT_ID);
      console.log('ZOHO_CLIENT_SECRET=' + CLIENT_SECRET);
      console.log('ZOHO_REFRESH_TOKEN=' + response.refresh_token);
      console.log('ZOHO_ACCOUNT_ID=' + (response.api_domain || 'https://mail.zoho.com'));
      
      console.log('\n✅ Setup complete! Your email service is ready to use.');
      
    } catch (error) {
      console.error('❌ Failed to parse response:', error);
      console.error('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error);
});

req.write(tokenData);
req.end();