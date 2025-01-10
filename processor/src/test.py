import json
import os
from pydantic import BaseModel
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
)

class CardData(BaseModel):
    cards: list[str]

config = [
    {
        "sector": "de un ecommerce de ropa",
        "action": "agradecer su pedido",
    },
]

cards = []
for c in config:
    result = client.beta.chat.completions.parse(
        model="gpt-4o-2024-08-06",
        messages=[
            {
                "role": "system",
                "content": f"""Somos Manuscritten, una startup en el sector del marketing en el que ayudamos a equipos de marketing y comunicación a impactar en sus clientes a través de cartas postales manuscritas. Nos integramos con el resto de herramientas del ecosistema digital de un equipo de marketing para poder hacerlo a escala y de forma personalizada.

    Nuestro público objetivo incluye CMOs, directores de marketing, especialistas en marketing digital.

    Voy a enviarte un PDF con con nuestros servicios, en el que entenderás un poco mejor qué hacemos y cómo lo hacemos. Quiero que escribas un post en el que me ayudes a explicar los motivos de por qué hacemos esto y para quién, en esta era de "saturación digital".

    Queremos que el resultado sea un post orientado a publicar en mi LinkedIn con un tono de voz sencillo, directo al grano y sin rodeos, pero en el que expliques por qué es buen momento para impactar en sus clientes de una forma única y diferente, además de realista.

    Tu labor consiste en generar textos para cartas manuscritas, entorno 40 - 80 palabras.

    Por ejemplo esta sería una
    Estimado cliente,
    le agradezco sinceramente su pedido. Estamos felices de contar con usted entre nuestros clientes leales y esperamos que quede completamente satisfecho con su compra. No dude en contactarnos si tiene alguna pregunta o inquietud.
    Atentamente,
    [Tu nombre] """,
            },
            {
                "role": "user",
                "content": f"Escribe entre 2 y 5 cartas para enviar a clientes {c.get("sector")} para {c.get("action")}",
            },
        ],
        response_format=CardData,
    )

    data = result.choices[0].message.parsed
    if data is None:
        print("No data")

    cards.append(data)

result = []
for i in range(len(cards)):
    meta = config[i]
    card = cards[i]

    result.append(
        {
            "sector": meta.get("sector"),
            "action": meta.get("action"),
            "alternatives": card.cards,
        }
    )

f = open("output.json", "w")
json.dump(result, f, indent=4)
