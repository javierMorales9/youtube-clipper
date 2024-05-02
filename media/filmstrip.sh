ffmpeg -i public/test.mp4 -frames 1 -vf "select=not(mod(n\,800)),scale=100:-2,tile=10x1" ffmpeg/output/flimstrip.png -y
