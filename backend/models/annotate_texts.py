import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

load_dotenv()

DOCKER: str | None = os.getenv("DOCKER")


app: Flask = Flask(__name__)
if DOCKER != "true":
    CORS(
        app,
        allow_headers=["Content-Type", "Authorization"],
    )


@app.before_request
def require_api_key():
    if request.endpoint == "health":
        return None

    if request.method == "OPTIONS" and DOCKER != "true":
        return _cors_preflight_response()

    auth_response = check_api_key(request)
    if auth_response is not None:
        return auth_response

    return None


def _cors_preflight_response():
    """Handles CORS preflight OPTIONS requests."""
    response = jsonify({"success": True})
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    response.headers.add("Access-Control-Allow-Headers", "Authorization, Content-Type")
    return response


def check_api_key(request):
    expected_api_key = os.getenv("MODELS_API_KEY")

    if not expected_api_key:
        return jsonify(
            {"success": False, "error": "Missing API_KEY in environment"}
        ), 404

    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify(
            {"success": False, "error": "Invalid or missing Bearer token"}
        ), 401

    provided_api_key = auth_header.split("Bearer ")[1]

    if provided_api_key != expected_api_key:
        return jsonify({"success": False, "error": "Invalid API key"}), 403

    return None


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
