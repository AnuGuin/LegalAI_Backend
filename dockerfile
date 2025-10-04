# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma Client
RUN npx prisma generate

# Copy built application
COPY dist ./dist

# Expose port
EXPOSE 10000

# Start application
CMD ["npm", "start"]