FROM ubuntu:rolling
#FROM jrottenberg/ffmpeg:3.4-vaapi

#
# Update and upgrade the system
#
RUN apt-get -y update
RUN apt-get -y upgrade

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

#
# Install Python3.10
#
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
RUN ln -s /opt/python3.10/bin/python3.10 /usr/bin/python

#
# Install git
#
RUN apt install -y git

#
# Install ffmpeg
#
#RUN apt-get install -y ffmpeg
WORKDIR "/install"
RUN apt-get install -y nasm
RUN git clone https://code.videolan.org/videolan/x264.git
WORKDIR "/install/x264"
RUN ./configure --enable-shared
RUN make
RUN make install
#RUN sudo cp x264.pc /usr/local/lib/pkgconfig/
WORKDIR "/install"
RUN git clone https://git.ffmpeg.org/ffmpeg.git ffmpeg
WORKDIR "/install/ffmpeg"
RUN ./configure --enable-shared --enable-gpl --enable-libx264
RUN make
RUN make install
RUN ldconfig

#
#Set up Project
#
WORKDIR /app

COPY package.json ./

#RUN npm init -y
RUN npm install

COPY index.js file.py ./

# We want to persist the video files between sessions.
VOLUME /public

CMD ["node", "index.js"]
