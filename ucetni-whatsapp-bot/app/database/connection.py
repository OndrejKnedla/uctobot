import os
import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from contextlib import asynccontextmanager

from .models import Base

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Správce databázového připojení s connection pooling"""
    
    def __init__(self):
        self.engine = None
        self.async_session_maker = None
        self._initialized = False
    
    def initialize(self, database_url: str = None):
        """Inicializuje databázové připojení"""
        if self._initialized:
            return
            
        if not database_url:
            database_url = os.getenv('DATABASE_URL')
        
        if not database_url:
            raise ValueError("DATABASE_URL musí být nastaven v environment variables")
        
        # Konverze pro async SQLAlchemy
        if database_url.startswith('postgresql://'):
            database_url = database_url.replace('postgresql://', 'postgresql+asyncpg://', 1)
        elif database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql+asyncpg://', 1)
        elif database_url.startswith('sqlite:///'):
            database_url = database_url.replace('sqlite:///', 'sqlite+aiosqlite:///', 1)
        
        try:
            # Nastavení podle typu databáze
            engine_kwargs = {
                "echo": False,  # Set to True for SQL logging in development
                "future": True,
            }
            
            if database_url.startswith('sqlite'):
                # SQLite specifické nastavení
                engine_kwargs.update({
                    "poolclass": NullPool,  # SQLite nepodporuje connection pooling
                    "connect_args": {"check_same_thread": False}
                })
            else:
                # PostgreSQL nastavení pro Supabase
                engine_kwargs.update({
                    "pool_size": 5,           # Počet trvalých připojení
                    "max_overflow": 10,        # Dodatečná připojení při zátěži
                    "pool_pre_ping": True,     # Testuje připojení před použitím
                    "pool_recycle": 3600,      # Recyklace připojení každou hodinu
                    "connect_args": {
                        "command_timeout": 60,
                        "server_settings": {
                            "application_name": "ucetni_whatsapp_bot",
                            "timezone": "Europe/Prague"
                        }
                    }
                })
            
            # Pro pgbouncer - zakázat prepared statements na úrovni URL
            if 'pooler.supabase.com' in database_url:
                database_url += '?prepared_statement_cache_size=0'
            
            # Vytvoření async engine
            self.engine = create_async_engine(database_url, **engine_kwargs)
            
            # Vytvoření session maker
            self.async_session_maker = async_sessionmaker(
                bind=self.engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autoflush=True,
                autocommit=False
            )
            
            self._initialized = True
            logger.info("Databáze úspěšně inicializována")
            
        except Exception as e:
            logger.error(f"Chyba při inicializaci databáze: {str(e)}")
            raise
    
    @asynccontextmanager
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """
        Context manager pro získání databázové session
        
        Usage:
            async with db_manager.get_session() as session:
                result = await session.execute(select(User))
        """
        if not self._initialized:
            raise RuntimeError("DatabaseManager není inicializován. Zavolejte initialize() nejdříve.")
        
        async with self.async_session_maker() as session:
            try:
                yield session
            except SQLAlchemyError as e:
                logger.error(f"Databázová chyba: {str(e)}")
                await session.rollback()
                raise
            except Exception as e:
                logger.error(f"Neočekávaná chyba při práci s databází: {str(e)}")
                await session.rollback()
                raise
            finally:
                await session.close()
    
    async def create_tables(self):
        """Vytvoří všechny tabulky v databázi"""
        if not self.engine:
            raise RuntimeError("Engine není inicializován")
        
        try:
            async with self.engine.begin() as conn:
                # Vytvoří všechny tabulky definované v models.py
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Tabulky úspěšně vytvořeny")
        except Exception as e:
            logger.error(f"Chyba při vytváření tabulek: {str(e)}")
            raise
    
    async def drop_tables(self):
        """Smaže všechny tabulky (pouze pro development/testing)"""
        if not self.engine:
            raise RuntimeError("Engine není inicializován")
        
        try:
            async with self.engine.begin() as conn:
                await conn.run_sync(Base.metadata.drop_all)
            logger.info("Tabulky úspěšně smazány")
        except Exception as e:
            logger.error(f"Chyba při mazání tabulek: {str(e)}")
            raise
    
    async def close(self):
        """Zavře databázové připojení"""
        if self.engine:
            await self.engine.dispose()
            self._initialized = False
            logger.info("Databázové připojení zavřeno")
    
    async def check_connection(self) -> bool:
        """Otestuje databázové připojení"""
        if not self.engine:
            return False
        
        try:
            async with self.get_session() as session:
                await session.execute(text("SELECT 1"))
            return True
        except Exception as e:
            logger.error(f"Test připojení selhal: {str(e)}")
            return False
    
    async def get_health_info(self) -> dict:
        """Vrátí informace o stavu databáze"""
        try:
            pool = self.engine.pool
            
            return {
                'connected': await self.check_connection(),
                'pool_size': pool.size(),
                'checked_in': pool.checkedin(),
                'checked_out': pool.checkedout(),
                'overflow': pool.overflow(),
            }
        except Exception as e:
            logger.error(f"Chyba při získávání health info: {str(e)}")
            return {
                'connected': False,
                'error': str(e)
            }

# Globální instance database managera
db_manager = DatabaseManager()

# Dependency pro FastAPI
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency pro získání databázové session"""
    async with db_manager.get_session() as session:
        yield session

# Utility funkce pro inicializaci
async def init_database(database_url: str = None, create_tables: bool = True):
    """
    Inicializuje databázi - volá se při startu aplikace
    
    Args:
        database_url: Connection string (pokud None, použije se z ENV)
        create_tables: Zda vytvořit tabulky
    """
    try:
        db_manager.initialize(database_url)
        
        if create_tables:
            await db_manager.create_tables()
            logger.info("Databáze inicializována a tabulky vytvořeny")
        else:
            logger.info("Databáze inicializována (bez vytváření tabulek)")
            
    except Exception as e:
        logger.error(f"Chyba při inicializaci databáze: {str(e)}")
        raise

async def close_database():
    """Zavře databázové připojení - volá se při shutdown aplikace"""
    await db_manager.close()

# Testovací funkce pro ověření připojení
async def test_database_connection():
    """Otestuje připojení k databázi"""
    try:
        success = await db_manager.check_connection()
        if success:
            logger.info("✅ Test připojení k databázi úspěšný")
            return True
        else:
            logger.error("❌ Test připojení k databázi selhal")
            return False
    except Exception as e:
        logger.error(f"❌ Chyba při testování připojení: {str(e)}")
        return False

# Error handling wrapper pro databázové operace
def handle_db_errors(func):
    """Decorator pro handling databázových chyb"""
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except SQLAlchemyError as e:
            logger.error(f"Databázová chyba v {func.__name__}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Neočekávaná chyba v {func.__name__}: {str(e)}")
            raise
    return wrapper