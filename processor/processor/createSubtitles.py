import ffmpeg
import os
import json
from extractInterventions import extractInterventions
from source.Source import Source
import math
from typing import List
from openai import OpenAI
from openai.types.embedding import Embedding
import tiktoken
import numpy as np
import pandas as pd

def createSubtitles(source: Source):
    env = os.environ["ENV"]

    if env == "dev":
        path = os.environ["FILES_PATH"]

        interventions = extractInterventions("../public")
        print(interventions)
