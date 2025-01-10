import os
from flask import Flask, json
import threading
from waitress import serve

app = Flask(__name__)


@app.route("/")
@app.route("/status")
def status():
    response = app.response_class(
        response=json.dumps(
            {
                "status": "ok",
            }
        ),
        status=200,
        mimetype="application/json",
    )

    return response


def flask_server():
    host_name = os.environ["HOST_NAME"]
    port = os.environ["PORT"]

    print(f"Starting Flask server at {host_name}:{port}")
    threading.Thread(target=lambda: serve(app, host=host_name, port=port)).start()
