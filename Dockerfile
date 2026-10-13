FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/out ./out
ENV NODE_ENV=production
EXPOSE 7778
CMD ["serve", "out", "-l", "7778", "--no-clipboard"]
