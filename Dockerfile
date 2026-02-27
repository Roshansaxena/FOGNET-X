# Use lightweight Python image
FROM python:3.10-slim

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir \
    paho-mqtt \
    flask \
    requests \
    psutil \
    scikit-learn \
    joblib \
    pandas \
    matplotlib \
    seaborn

EXPOSE 5000

CMD ["python", "-m", "services.mqtt_service"]
