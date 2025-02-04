#!/usr/bin/env bash

/app/venv/bin/python -c "from lbnlp.models.fetch import ModelPkgLoader; ModelPkgLoader('matbert_ner_2021v1').load()"

exec /app/venv/bin/gunicorn --bind 0.0.0.0:8000 annotate_texts:app --timeout 300