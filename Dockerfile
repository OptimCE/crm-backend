# Build stage
# This stage is responsible for installing all dependencies and building the application.
# TLDR: This stage contains all the source code and node modules needed to transcpile the typescript code to javascript and necessary dev dependencies to do so.
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Could be used to import private repositories if needed
RUN apk add --no-cache git
# Rebuild a clean node_modules based on the package-lock.json to ensure consistency
RUN npm install --package-lock-only
RUN npm ci
COPY . .
RUN npm run build

# Production stage
# This stage is optimized for production use, containing only the necessary files and dependencies to run the application.
# TLDR: This stage contains only the javascript tranpiled code and necessary nodes modules for it to run.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci
COPY --from=builder /app/dist ./dist
EXPOSE 3000
USER  node
CMD ["node", "dist/index.js"]