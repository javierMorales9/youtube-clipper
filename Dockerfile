FROM ubuntu:20.04 AS base

ARG PORT=3000

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

#
# Install Python3.12, needed for some dependencies
#
# Copy the requirements file to the working directory
RUN mkdir /opt/python3.12

# To avoid .pyc files and save space
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install all dependecnies you need to compile Python3.12
RUN apt update
RUN DEBIAN_FRONTEND="noninteractive" apt install --yes wget libffi-dev gcc build-essential curl tcl-dev tk-dev uuid-dev lzma-dev liblzma-dev libssl-dev libsqlite3-dev

# Download Python source code from official site and build it
RUN wget https://www.python.org/ftp/python/3.12.0/Python-3.12.0.tgz
RUN tar -zxvf Python-3.12.0.tgz
RUN cd Python-3.12.0 && ./configure --prefix=/opt/python3.12 && make && make install

# Delete the python source code and temp files
RUN rm Python-3.12.0.tgz
RUN rm -r Python-3.12.0/

# Now link it so that $python works
RUN ln -s /opt/python3.12/bin/python3.12 /usr/bin/python
RUN ln -s /opt/python3.12/bin/pip3 /usr/bin/pip

#
# Install Node.js
#
ENV NODE_VERSION=20.13.1
RUN apt install -y curl
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"
RUN node --version
RUN npm --version

# Dependencies
FROM base AS dependencies
COPY package.json package-lock.json ./

RUN npm install

# Test
FROM base AS test
COPY --from=dependencies /app/node_modules ./node_modules

COPY . .

CMD ["npm", "test"]

# Build
FROM base AS build

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Public build-time environment variables
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV SKIP_ENV_VALIDATION=true

RUN npm run build

# Run
FROM base AS prod

ENV NODE_ENV=production
ENV PORT=$PORT

#RUN addgroup --system --gid 1001 nodejs
#RUN adduser --system --uid 1001 nextjs
#RUN mkdir .next
#RUN chown nextjs:nodejs .next

COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/public ./public

EXPOSE $PORT

ENV HOSTNAME="0.0.0.0"
CMD ["npm", "start"]
