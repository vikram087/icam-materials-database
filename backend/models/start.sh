#!/usr/bin/env bash

/app/venv/bin/python -c "from lbnlp.models.fetch import ModelPkgLoader; ModelPkgLoader('matbert_ner_2021v1').load()"

# add logging here

exec /app/venv/bin/gunicorn annotate_texts:app \
    -b 0.0.0.0:8000 \
    --timeout 300 \
    --access-logfile - \
    --error-logfile - \
    --loglevel debug \
    --capture-output \
    --enable-stdio-inheritance