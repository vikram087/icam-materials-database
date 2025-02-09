# Setup of Lbnlp Models (Matbert, Matscholar, Relevance)

This guide provides steps for setting up Lbnlp models, useful for NER tasks on materials science texts. Original repositories:

- [Lbnlp main repo (Matbert, Matscholar, Relevance implementation)](https://github.com/lbnlp/lbnlp)
- [Lbnlp Matbert Repo (model download)](https://github.com/lbnlp/MatBERT)
- [CederGroupHub Matbert Repo (model testing/training)](https://github.com/CederGroupHub/MatBERT_NER)

The point of this setup is for the `annotate_texts.py` server to be called when the add_papers.py script is run.

## Table of Contents

- [Prereqs](#prereqs)
- [Common Setup (Required for all 3 models)](#common-setup-required-for-all-3-models)
- [Matbert](#matbert)
- [Matscholar/Relevance](#matscholarrelevance)
- [Setup .env File]()

## Prereqs
- **Architecture**: Machine running `amd64` (tested on Ubuntu 22.04 amd64, t2.medium (2vcpu, 8GiB mem))

## Common Setup (Required for all 3 models)

1. **Clone the repository**

   Clone the repo and navigate to the lbnlp directory.

   ```bash
   git clone https://github.com/vikram087/icam-materials-database.git
   cd icam-materials-database/backend/lbnlp
   ```

2. **Install system dependencies**

   Install necessary dependencies for Python 3.7 and building packages.

   ```bash
   sudo apt update 
   sudo add-apt-repository ppa:deadsnakes/ppa 
   sudo apt install python3.7 python3.7-venv python3.7-dev build-essential
   ```

3. **Install Python dependencies for the chosen model**

   > Unfortunately, Matbert and Matscholar/Relevance have conflicting dependencies, so you must install them in separate virtual environments

   Choose the model-specific dependencies: [Matbert](#matbert) or [Matscholar/Relevance](#matscholarrelevance).

---

4. **Edit pdfminer library** 

   > **Note**: If you encounter import errors with `pdfminer`, edit the `__init__.py` file as follows:
   > **Note**: This code is in pdfminer.py for reference

   ```bash
   vim <environment path>/lib/python3.7/site-packages/pdfminer/__init__.py
   ```

   Replace:
   ```python
   from importlib.metadata import version, PackageNotFoundError
   ```
   With:
   ```python
   from importlib_metadata import version, PackageNotFoundError
   ```

5. **Download chemdataextractor models**  

   Download the required data for `chemdataextractor`.

   ```bash
   cde data download
   ```

6. **Test the setup**

   Run a test to verify that everything is set up correctly:

   ```bash
   python test.py --model-type <model type>
   ```
   Replace `<model type>` with the model you want to test (`matbert`, `matscholar`, or `relevance`).

7. **Run the Server (matbert)**

   ```bash
   python annotate_texts.py
   ```

## Matbert

**Set up Python environment and install dependencies:**

```bash
python3.7 -m venv <environment path>
source <environment path>/bin/activate
pip install -r requirements-shared.txt
pip install -r requirements-matbert.txt
```

## Matscholar/Relevance

**Set up Python environment and install dependencies:**

```bash
python3.7 -m venv <environment path>
source <environment path>/bin/activate
pip install -r requirements-shared.txt
pip install -r requirements-matscholar-relevance.txt
```

## Setup `.env` file

### 2. Set up `.env` File

Create a `.env` file for the models. Replace `your-api-key` with the API key you obtain from running `openssl rand -hex 32`.

   ```ini
   # api key for models
   MODELS_API_KEY=your-api-key
   ```