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
EXPOSE 3000
CMD ["serve", "out", "-l", "3000", "--no-clipboard"]
