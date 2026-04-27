# import os
#
# PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# DB_NAME = os.path.join(PROJECT_ROOT, "fognetx.db")
import os

# Project root still needed by other modules
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Database path - use Docker volume for production, local for development
# Docker containers have /data directory mounted as volume
DB_NAME = os.getenv("DB_PATH", "/data/fognetx.db")