/**
 * Debug script to test Clerk configuration in Railway
 */

const express = require('express');
const { verifyToken } = require('@clerk/backend');

const app = express();

// Debug endpoint to check Clerk environment variables
app.get('/debug/clerk-env', (req, res) => {
  res.json({
    hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
    clerkSecretKeyLength: process.env.CLERK_SECRET_KEY ? process.env.CLERK_SECRET_KEY.length : 0,
    clerkSecretKeyPrefix: process.env.CLERK_SECRET_KEY ? process.env.CLERK_SECRET_KEY.substring(0, 10) + '...' : 'not set',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to test token verification
app.get('/debug/verify-token', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(400).json({ error: 'No Bearer token provided' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    console.log('🔍 Testing token verification...');
    console.log('Token length:', token.length);
    console.log('Has CLERK_SECRET_KEY:', !!process.env.CLERK_SECRET_KEY);
    
    const verifiedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      authorizedParties: ['https://mindhub.cloud', 'https://www.mindhub.cloud']
    });
    
    console.log('✅ Token verified successfully');
    console.log('Token claims:', Object.keys(verifiedToken));
    
    res.json({
      success: true,
      message: 'Token verified successfully',
      claims: {
        userId: verifiedToken.user_id || verifiedToken.sub,
        email: verifiedToken.email,
        iss: verifiedToken.iss,
        azp: verifiedToken.azp,
        exp: new Date(verifiedToken.exp * 1000).toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    console.error('Error details:', error);
    
    res.status(401).json({
      success: false,
      error: error.message,
      details: {
        name: error.name,
        stack: error.stack
      }
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
});