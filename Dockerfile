FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/out ./out
# Static site + /relay realtime bus (operator console → fan phones). No deps.
COPY --from=build /app/server ./server
ENV NODE_ENV=production
EXPOSE 7778
CMD ["node", "server/relay-server.mjs", "out"]
