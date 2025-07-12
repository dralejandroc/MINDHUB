import { handleAuth, handleLogin, handleLogout, handleCallback, handleProfile } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE,
      scope: process.env.AUTH0_SCOPE,
    },
  }),
  logout: handleLogout({
    returnTo: process.env.AUTH0_BASE_URL
  }),
  callback: handleCallback(),
  profile: handleProfile()
});