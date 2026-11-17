# learnalgorithms.dev API: Python standard library only, no third-party packages.
FROM python:3.15-slim

RUN useradd --system --uid 10001 --no-create-home app \
 && mkdir /data && chown app /data

COPY app/server.py /app/server.py

USER 10001
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8080 DB_PATH=/data/api.sqlite3
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/health', timeout=2)"

CMD ["python", "/app/server.py"]
