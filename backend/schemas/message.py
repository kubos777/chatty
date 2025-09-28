from pydantic import BaseModel


class MessageCreate(BaseModel):
    content: str
    room_id: int
    message_type: str = "text"
