import sys
import os

# Add the parent directory to the Python path so we can import from app/
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.main import app

# Export the FastAPI app as handler for Vercel
handler = app