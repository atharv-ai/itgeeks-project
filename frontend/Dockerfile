# ─── Stage 1: deps ─────────────────────────────────────────────────────────────
# Install node_modules in a separate stage for better layer caching.
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --prefer-offline


# ─── Stage 2: dev server ───────────────────────────────────────────────────────
FROM node:22-alpine AS dev

WORKDIR /app

# Copy installed modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the source
COPY . .

# Expose the Vite dev server port
EXPOSE 5173

# --host 0.0.0.0  → makes Vite listen on all interfaces inside the container
# --port 5173     → explicit port for clarity
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]
