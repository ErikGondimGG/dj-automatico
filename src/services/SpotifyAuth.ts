import { authorize } from "react-native-app-auth";

const spotifyConfig = {
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  redirectUrl: process.env.SPOTIFY_REDIRECT_URI!,
  scopes: process.env.SPOTIFY_SCOPES!.split(","),
  serviceConfiguration: {
    authorizationEndpoint: "https://accounts.spotify.com/authorize",
    tokenEndpoint: "https://accounts.spotify.com/api/token",
  },
};

export const spotifyAuth = async () => {
  try {
    const result = await authorize(spotifyConfig);
    return result.accessToken;
  } catch (error) {
    console.error("Spotify auth error:", error);
    return null;
  }
};
