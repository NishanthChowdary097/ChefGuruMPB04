FROM python:3.14-slim AS builder

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY ./auth/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.14-slim AS runtime

RUN useradd -m -u 1000 app_user

COPY --from=builder --chown=app_user:app_user /opt/venv /opt/venv

RUN apt-get update && apt-get install -y ca-certificates

ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

COPY --chown=app_user:app_user ./auth ./auth
COPY --chown=app_user:app_user ./ODM ./ODM
COPY --chown=app_user:app_user config.py .
copy --chown=app_user:app_user .env .

USER app_user

EXPOSE ${AUTH_SERVER_PORT:-5000}
ENTRYPOINT ["sh", "-c", "exec gunicorn -w ${GUNICORN_WORKERS:-1} -b 0.0.0.0:${AUTH_SERVER_PORT:-5000} auth.start:app"]