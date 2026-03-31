from typing import Optional
from pydantic import BaseModel


class LLMInvokeRequest(BaseModel):
    prompt: str
    response_json_schema: Optional[dict] = None
