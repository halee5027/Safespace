FROM python:3.11-slim

WORKDIR /app

# Copy requirements
COPY aiservices/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY aiservices/app ./app

# Expose port
EXPOSE 8000

# Start uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
