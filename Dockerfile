# Build stage - Main App
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the main application
RUN pnpm build

# Build stage - Slides
FROM node:22-alpine AS slides-builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /slides

# Copy slides package files
COPY slides/package.json slides/pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy slides source
COPY slides/ .

# Build slides
RUN pnpm build

# Production stage
FROM node:22-alpine AS production

# Install pnpm for running slidev
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy built main application
COPY --from=builder /app/.output ./.output

# Copy built slides
COPY --from=slides-builder /slides/dist ./slides-dist

# Install serve for static slides
RUN npm install -g serve

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV SLIDES_PORT=3001

# Expose ports
EXPOSE 3000 3001

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'node /app/.output/server/index.mjs &' >> /start.sh && \
    echo 'serve -s /app/slides-dist -l $SLIDES_PORT &' >> /start.sh && \
    echo 'wait' >> /start.sh && \
    chmod +x /start.sh

# Start both applications
CMD ["/bin/sh", "/start.sh"]
