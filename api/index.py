import sys
import os

# Add the project root to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Add backend directory to python path to allow direct imports from backend modules
sys.path.append(
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
)

from backend.main import app
