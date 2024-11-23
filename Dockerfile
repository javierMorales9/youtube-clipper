FROM ubuntu:rolling as base

# 1. Install dependencies only when needed
FROM base AS deps

#
# Update and upgrade the system
#
RUN apt-get -y update
RUN apt-get -y upgrade

#
# Install Node
#
ENV NODE_VERSION=16.13.0
RUN apt install -y curl
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"
RUN node --version
RUN npm --version

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i; \
  else echo "Lockfile not found." && exit 1; \
  fi

# 2. Rebuild the source code only when needed
FROM base as builder
WORKDIR /app
COPY . .

ENV NEXT_PRIVATE_STANDALONE true
ENV SKIP_ENV_VALIDATION = true

COPY --from=deps /app/node_modules ./node_modules

ENV NODE_ENV=production
RUN npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
EXPOSE 3000

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

CMD node server.js

FROM base AS dev
WORKDIR /app
EXPOSE 3000

ENV NODE_ENV=development

COPY . .

COPY --from=deps /app/node_modules ./node_modules

CMD ["npm", "run", "dev"]
