# Development stage (optional, can be used for debugging and as a devcontainer)
FROM node:22-alpine AS development
WORKDIR /app
ENV NODE_ENV=development
COPY package*.json ./
RUN apk add --no-cache git
RUN npm ci
USER node
COPY . .
EXPOSE 3000
# Sleep for infinite time to keep the container running for debugging purposes
CMD ["sleep", "infinity"]

# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Could be used to import private repositories if needed
RUN apk add --no-cache git
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci
COPY --from=builder /app/dist ./dist
EXPOSE 3000
USER  node
CMD ["node", "dist/index.js"]