from select import select

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
import socketio
import uvicorn

from database import init_db, get_db, AsyncSessionLocal
from auth import (
    create_user,
    authenticate_user,
    create_access_token,
    verify_token,
    get_user_by_id,
    get_user_by_email,
)
from models import User, Room, Message, RoomMembership
from schemas.user import UserRegister, UserLogin

security = HTTPBearer()


async def create_default_rooms():
    """Crear rooms por defecto si no existen"""
    async with AsyncSessionLocal() as db:
        try:
            # Intentar crear room general directamente
            room1 = Room(
                id=1,
                name="General",
                description="General chat room",
                is_private=False,
                room_type="public"
            )
            db.add(room1)
            await db.commit()
            print("Room 'General' creada")
        except Exception as e:
            # Si ya existe, hacer rollback
            await db.rollback()
            print(f"Room ya existe o error: {e}")

# Lifespan para inicializar DB
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Iniciando aplicación...")
    await init_db()
    print("Base de datos inicializada")
    await create_default_rooms()
    print("Rooms inicializados")
    yield
    print("Cerrando aplicación...")

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

app = FastAPI(
    title="Realtime Chat API",
    description="Real-time chat with auth and persistence",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

socket_app = socketio.ASGIApp(sio, app)

# Store para usuarios conectados
connected_users = {}


# Auth dependency para WebSockets
async def get_current_user_ws(token: str):
    payload = verify_token(token)
    if not payload:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    async with AsyncSessionLocal() as db:
        return await get_user_by_id(db, int(user_id))


# REST Endpoints
@app.post("/auth/register")
async def register(
    user_data: UserRegister, db: AsyncSession = Depends(get_db)
):
    # Check if user exists
    existing_user = await get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = await create_user(
        db, user_data.username, user_data.email, user_data.password
    )
    return {"message": "User created successfully", "user_id": user.id}


@app.post("/auth/login")
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, user_data.email, user_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        },
    }


@app.get("/")
def read_root():
    return {"message": "Realtime Chat API with Auth is running!"}


# WebSocket events
@sio.event
async def connect(sid, environ):
    print(f"Client {sid} connected")
    await sio.emit("connected", {"message": "Connected"}, room=sid)


@sio.event
async def disconnect(sid):
    print(f"Client {sid} disconnected")
    if sid in connected_users:
        user_data = connected_users[sid]

        # Update user status to offline
        async with AsyncSessionLocal() as db:
            user = await get_user_by_id(db, user_data["user_id"])
            if user:
                user.is_online = False
                user.last_seen = datetime.utcnow()
                await db.commit()

        del connected_users[sid]

        # Broadcast updated users list to all clients
        await sio.emit(
            "users_list",
            {"users": [u["username"] for u in connected_users.values()]},
        )


@sio.event
async def authenticate(sid, data):
    token = data.get('token')
    if not token:
        await sio.emit('auth_error', {'message': 'Token required'}, room=sid)
        return

    user = await get_current_user_ws(token)
    if not user:
        await sio.emit('auth_error', {'message': 'Invalid token'}, room=sid)
        return

    # Remover sesiones anteriores del mismo usuario
    for old_sid, user_data in list(connected_users.items()):
        if user_data['user_id'] == user.id and old_sid != sid:
            del connected_users[old_sid]

    connected_users[sid] = {
        'user_id': user.id,
        'username': user.username,
        'status': user.status,  # Agregar status
        'sid': sid
    }

    # Update user status to online
    async with AsyncSessionLocal() as db:
        user.is_online = True
        user.status = 'online'  # Reset to online on connect
        await db.commit()

    await sio.emit('authenticated', {
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'status': 'online'
        }
    }, room=sid)

    # Send updated users list with status
    users_with_status = []
    for user_data in connected_users.values():
        users_with_status.append({
            'username': user_data['username'],
            'status': user_data.get('status', 'online')
        })

    await sio.emit('users_list_with_status', {
        'users': users_with_status
    })

@sio.event
async def join_room(sid, data):
    if sid not in connected_users:
        await sio.emit('auth_error', {'message': 'Not authenticated'}, room=sid)
        return

    room_id = data.get('room_id', 1)
    room_name = f"room_{room_id}"
    await sio.enter_room(sid, room_name)

    user_data = connected_users[sid]
    print(f"User {user_data['username']} joined {room_name}")  # Debug

    await sio.emit('user_joined_room', {
        'user': user_data['username'],
        'room_id': room_id
    }, room=room_name)


@sio.event
async def send_message(sid, data):
    if sid not in connected_users:
        await sio.emit('auth_error', {'message': 'Not authenticated'}, room=sid)
        return

    room_id = data.get('room_id', 1)
    content = data.get('message', '')
    room_name = f"room_{room_id}"

    print(f"Message from {connected_users[sid]['username']} to {room_name}: {content}")  # Debug

    if not content.strip():
        return

    user_data = connected_users[sid]

    # Save to database
    async with AsyncSessionLocal() as db:
        message = Message(
            content=content,
            sender_id=user_data['user_id'],
            room_id=room_id
        )
        db.add(message)
        await db.commit()
        await db.refresh(message)

        message_data = {
            'id': message.id,
            'message': message.content,
            'username': user_data['username'],
            'room_id': room_id,
            'timestamp': message.created_at.isoformat()
        }

    print(f"Broadcasting message to {room_name}")  # Debug
    await sio.emit('new_message', message_data, room=room_name)


@sio.event
async def typing_start(sid, data):
    """User started typing"""
    if sid not in connected_users:
        return

    room_id = data.get("room_id", 1)
    user_data = connected_users[sid]

    await sio.emit(
        "typing_start",
        {"username": user_data["username"], "room_id": room_id},
        room=f"room_{room_id}",
        skip_sid=sid,
    )  # No enviar al que está escribiendo


@sio.event
async def typing_stop(sid, data):
    """User stopped typing"""
    if sid not in connected_users:
        return

    room_id = data.get("room_id", 1)
    user_data = connected_users[sid]

    await sio.emit(
        "typing_stop",
        {"username": user_data["username"], "room_id": room_id},
        room=f"room_{room_id}",
        skip_sid=sid,
    )


@sio.event
async def update_status(sid, data):
    """Update user presence status"""
    if sid not in connected_users:
        return

    status = data.get('status', 'online')  # online, away, busy
    user_data = connected_users[sid]

    # Update in database
    async with AsyncSessionLocal() as db:
        user = await get_user_by_id(db, user_data['user_id'])
        if user:
            user.status = status
            await db.commit()

    # Update connected users store
    connected_users[sid]['status'] = status

    # Broadcast status change
    await sio.emit('status_changed', {
        'username': user_data['username'],
        'status': status
    })

    # Send updated users list with status
    users_with_status = []
    for user_data in connected_users.values():
        users_with_status.append({
            'username': user_data['username'],
            'status': user_data.get('status', 'online')
        })

    await sio.emit('users_list_with_status', {
        'users': users_with_status
    })


@sio.event
async def create_dm(sid, data):
    """Create or get existing DM room between two users"""
    if sid not in connected_users:
        return

    target_username = data.get('target_username')
    if not target_username:
        return

    current_user = connected_users[sid]

    # Find target user
    target_user_data = None
    for user_data in connected_users.values():
        if user_data['username'] == target_username:
            target_user_data = user_data
            break

    if not target_user_data:
        await sio.emit('dm_error', {'message': 'User not found or offline'}, room=sid)
        return

    # Create or find existing DM room
    async with AsyncSessionLocal() as db:
        # Check if DM room already exists
        existing_room = await db.execute(
            select(Room).where(
                Room.room_type == 'dm',
                Room.name.in_([
                    f"{current_user['username']}_{target_username}",
                    f"{target_username}_{current_user['username']}"
                ])
            )
        )
        room = existing_room.scalar_one_or_none()

        if not room:
            # Create new DM room
            room = Room(
                name=f"{current_user['username']}_{target_username}",
                description=f"DM between {current_user['username']} and {target_username}",
                is_private=True,
                room_type='dm',
                created_by=current_user['user_id']
            )
            db.add(room)
            await db.commit()
            await db.refresh(room)

            # Add both users as members
            for user_id in [current_user['user_id'], target_user_data['user_id']]:
                membership = RoomMembership(
                    user_id=user_id,
                    room_id=room.id
                )
                db.add(membership)
            await db.commit()

    # Join both users to the DM room
    dm_room_name = f"dm_{room.id}"
    await sio.enter_room(sid, dm_room_name)
    await sio.enter_room(target_user_data['sid'], dm_room_name)

    # Send DM room info to both users
    room_data = {
        'id': room.id,
        'name': room.name,
        'type': 'dm',
        'with_user': target_username if sid == current_user['sid'] else current_user['username']
    }

    await sio.emit('dm_created', room_data, room=sid)
    await sio.emit('dm_created', {
        **room_data,
        'with_user': current_user['username']
    }, room=target_user_data['sid'])


@sio.event
async def send_dm(sid, data):
    """Send message in DM"""
    if sid not in connected_users:
        return

    room_id = data.get('room_id')
    content = data.get('message', '')

    if not content.strip() or not room_id:
        return

    user_data = connected_users[sid]

    # Save to database
    async with AsyncSessionLocal() as db:
        message = Message(
            content=content,
            sender_id=user_data['user_id'],
            room_id=room_id
        )
        db.add(message)
        await db.commit()
        await db.refresh(message)

        message_data = {
            'id': message.id,
            'message': message.content,
            'username': user_data['username'],
            'room_id': room_id,
            'timestamp': message.created_at.isoformat(),
            'type': 'dm'
        }

    await sio.emit('new_dm_message', message_data, room=f"dm_{room_id}")

if __name__ == "__main__":
    uvicorn.run(socket_app, host="0.0.0.0", port=8000)
