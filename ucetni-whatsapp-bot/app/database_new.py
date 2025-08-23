from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Pro SQLite development
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Různé nastavení pro SQLite vs PostgreSQL
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        echo=settings.DEBUG,
        connect_args={"check_same_thread": False}  # SQLite specifické
    )
else:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,  # Kontrola spojení
        echo=settings.DEBUG  # True pro debug
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency pro FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Vytvoř tabulky
def init_db():
    from app.models import Base
    Base.metadata.create_all(bind=engine)
    print("✅ Databáze inicializována")