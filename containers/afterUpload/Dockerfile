FROM ubuntu:rolling
#FROM jrottenberg/ffmpeg:3.4-vaapi
WORKDIR /app

COPY package.json index.js file.py ./

RUN apt-get -y update
RUN apt-get -y upgrade

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
RUN npm init -y
RUN npm install

# Copy the requirements file to the working directory
RUN mkdir /opt/python3.10

# To avoid .pyc files and save space
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install all dependecnies you need to compile Python3.10
RUN apt update
RUN DEBIAN_FRONTEND="noninteractive" apt install --yes wget libffi-dev gcc build-essential curl tcl-dev tk-dev uuid-dev lzma-dev liblzma-dev libssl-dev libsqlite3-dev

# Download Python source code from official site and build it
RUN wget https://www.python.org/ftp/python/3.10.0/Python-3.10.0.tgz
RUN tar -zxvf Python-3.10.0.tgz
RUN cd Python-3.10.0 && ./configure --prefix=/opt/python3.10 && make && make install

# Delete the python source code and temp files
RUN rm Python-3.10.0.tgz
RUN rm -r Python-3.10.0/

# Now link it so that $python works
RUN ln -s /opt/python3.10/python3.10 /usr/bin/python

#
# Install ffmpeg
#
RUN apt-get install -y ffmpeg

# We want to persist the video files between sessions.
VOLUME /public

CMD ["node", "index.js"]
