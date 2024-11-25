FROM ubuntu:rolling as base

#
# Update and upgrade the system
#
RUN apt-get -y update
RUN apt-get -y upgrade

#
# Install Node
#
ENV NODE_VERSION=21.4.0
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

RUN npm install

COPY . .

ENV NEXT_PRIVATE_STANDALONE 'true'
ENV SKIP_ENV_VALIDATION = 'true'
ENV NODE_ENV = 'production'

RUN npm run build

EXPOSE 3000

CMD ["node", ".next/standalone/server.js"]
