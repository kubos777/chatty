import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from main import app, socket_app
from database import get_db, Base

# --- Test Database Setup (SQLite in-memory) ---
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
engine = create_async_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = async_sessionmaker(
    autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
)


# --- Pytest Fixtures ---

@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncSession:
    """Provides a clean database session for each test function."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        await session.close()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncClient:
    """Provides an async test client for making API requests."""
    async def override_get_db():
        """Override dependency to use the test session."""
        try:
            yield db_session
        finally:
            await db_session.close()

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=socket_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac