# anuguin/legalai_backend/LegalAI_Backend-8c62528d0e0f81dfd96c48133df93e0535fe2d6f/dockerfile

FROM node:20-alpine

WORKDIR /app

# 1. Copy essential files for installation and compilation
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/

# 2. Install ALL dependencies (Dev dependencies like 'typescript' and 'prisma' are needed for 'npm run build')
# 'npm ci' installs dependencies reliably based on package-lock.json
RUN npm ci

# 3. Run the build command (This is the critical missing step!)
# 'npm run build' runs "tsc && npx prisma generate"
# This creates the 'dist' folder and compiles src/server.ts to dist/server.js
RUN npm run build

# Optional Cleanup: Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 10000

# Start application
# 'npm start' runs "node dist/server.js", which now exists.
CMD ["npm", "start"]