FROM ubuntu:rolling AS base
#
# Update and upgrade the system
#
RUN apt-get -y update
RUN apt-get -y upgrade

#
# Install Python3.12
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
WORKDIR "/install"
RUN git clone https://git.ffmpeg.org/ffmpeg.git ffmpeg
WORKDIR "/install/ffmpeg"
RUN ./configure --enable-shared --enable-gpl --enable-libx264
RUN make
RUN make install
RUN ldconfig

RUN pip install poetry
ENV PATH="$PATH:$HOME/.local/bin"

WORKDIR /app

# We copy in two steps for caching purposes
COPY pyproject.toml poetry.lock ./

RUN python -m poetry install --no-root

COPY . .

# To stages, onr for running the tests and one for the final image
FROM base AS test
CMD ["python", "-m", "poetry", "run", "python3", "-m", "pytest"]

FROM base AS final
EXPOSE $PORT
CMD ["python", "-m", "poetry", "run", "python3", "processor/main.py"]
