from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from Uctobot API", "status": "running"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "uctobot"}

# Handler for Vercel
handler = app