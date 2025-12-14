import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

load_dotenv()

DOCKER = os.getenv("DOCKER")


app: Flask = Flask(__name__)
if DOCKER != "true":
    CORS(
        app,
        allow_headers=["Content-Type", "Authorization"],
    )


@app.route("/models/annotate/<model_type>", methods=["POST"])
def get_annotation(model_type: str) -> tuple:
    try:
        data: dict = request.get_json()
        docs: list = data.get("docs", [])

        model = model_selection(model_type)
        annotation: list = annotate(docs, model, model_type)

        return jsonify({"annotation": annotation}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/models/health", methods=["GET"])
def health() -> tuple:
    return jsonify({"message": "Success"}), 200


def model_selection(model_type: str):
    if model_type == "matscholar":
        from lbnlp.models.load.matscholar_2020v1 import load

        ner_model = load("ner")
    elif model_type == "matbert":
        from lbnlp.models.load.matbert_ner_2021v1 import load

        ner_model = load("solid_state")
    elif model_type == "relevance":
        from lbnlp.models.load.relevance_2020v1 import load

        ner_model = load("relevance")

    return ner_model


def annotate(docs: list, model, model_type: str) -> list:
    if model_type == "matscholar":
        tags: list = [model.tag_doc(doc) for doc in docs]
    elif model_type == "matbert":
        tags = model.tag_docs(docs)
    elif model_type == "relevance":
        tags = model.classify_many(docs)

    return tags


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=True)
