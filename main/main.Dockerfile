FROM python:3.14-slim AS builder

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY ./main/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.14-slim AS runtime

RUN useradd -m -u 1000 app_user

COPY --from=builder --chown=app_user:app_user /opt/venv /opt/venv

RUN apt-get update && apt-get install -y ca-certificates

ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

COPY --chown=app_user:app_user ./main ./main
COPY --chown=app_user:app_user ./ODM ./ODM
COPY --chown=app_user:app_user config.py .
copy --chown=app_user:app_user .env .

USER app_user

EXPOSE ${MAIN_SERVER_PORT:-5001}
ENTRYPOINT ["sh", "-c", "exec gunicorn -w ${GUNICORN_WORKERS:-1} -b 0.0.0.0:${MAIN_SERVER_PORT:-5001} main.start:app"]