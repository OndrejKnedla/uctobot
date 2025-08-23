FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy application
COPY . .

# Build Next.js application
RUN pnpm run build

# Expose port
EXPOSE 3000

# Start the application in development mode for hot reloading
CMD ["pnpm", "run", "dev"]