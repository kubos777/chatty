import pytest
from httpx import AsyncClient

# Mark all tests in this file as asyncio
pytestmark = pytest.mark.asyncio


async def test_register_user_success(client: AsyncClient):
    """Test successful user registration."""
    response = await client.post(
        "/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "User created successfully"
    assert "user_id" in data


async def test_register_user_duplicate_email(client: AsyncClient):
    """Test registration with a duplicate email fails."""
    # First, register a user
    await client.post(
        "/auth/register",
        json={
            "username": "testuser2",
            "email": "test2@example.com",
            "password": "password123",
        },
    )

    # Then, try to register another user with the same email
    response = await client.post(
        "/auth/register",
        json={
            "username": "anotheruser",
            "email": "test2@example.com",
            "password": "password456",
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"


async def test_login_success(client: AsyncClient):
    """Test successful user login."""
    # First, register a user to have credentials to log in with
    await client.post(
        "/auth/register",
        json={
            "username": "loginuser",
            "email": "login@example.com",
            "password": "password123",
        },
    )

    # Now, attempt to log in
    response = await client.post(
        "/auth/login",
        json={"email": "login@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "login@example.com"


async def test_login_failure_wrong_password(client: AsyncClient):
    """Test login with an incorrect password fails."""
    # Register a user
    await client.post(
        "/auth/register",
        json={
            "username": "wrongpassuser",
            "email": "wrongpass@example.com",
            "password": "password123",
        },
    )

    # Attempt to log in with the wrong password
    response = await client.post(
        "/auth/login",
        json={"email": "wrongpass@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


async def test_login_failure_wrong_email(client: AsyncClient):
    """Test login with a non-existent email fails."""
    response = await client.post(
        "/auth/login",
        json={"email": "nonexistent@example.com", "password": "password123"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"