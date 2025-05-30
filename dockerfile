FROM node:18.20-alpine3.19

ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"


WORKDIR /app

RUN apk update && apk upgrade && \
    npm install -g pnpm && \
    mkdir -p $PNPM_HOME && \
    npm install -g @expo/ngrok expo-cli

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .

ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV EAS_ENABLE_PROMPTS=false
ENV SPOTIFY_CLIENT_ID=f3b0e86ec6c241bab36fd980d6b64c6a
ENV SPOTIFY_REDIRECT_URI=dj-automatico://oauth
ENV SPOTIFY_SCOPES=user-read-recently-played,user-top-read,playlist-read-private

EXPOSE 19000 19001 19002

CMD ["sh", "-c", "cd android && ./gradlew clean && cd .. && pnpm", "expo", "start", "--tunnel", "--dev-client", "--devtools"]
