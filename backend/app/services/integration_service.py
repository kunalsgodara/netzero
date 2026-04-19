import os
import json
import uuid

import httpx
from fastapi import HTTPException, UploadFile

from app.config.settings import get_settings

settings = get_settings()

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"


_http_client: httpx.AsyncClient | None = None


def _get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(60.0, connect=10.0),
            limits=httpx.Limits(max_keepalive_connections=5, keepalive_expiry=30),
        )
    return _http_client


async def invoke_llm(prompt: str, response_json_schema: dict = None):
    if not settings.groq_api_key:
        raise HTTPException(status_code=500, detail="Groq API key not configured. Add GROQ_API_KEY to backend/.env")

    system_message = (
        "You are an expert carbon accounting and CBAM compliance advisor. "
        "Analyze the provided emissions and CBAM data and return ONLY valid JSON. "
        "Do not include any markdown, code fences, or explanatory text outside of the JSON."
    )

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 2048,
    }

    
    
    

    try:
        client = _get_http_client()
        resp = await client.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {settings.groq_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )

        if resp.status_code != 200:
            try:
                err_body = resp.json()
                detail = err_body.get("error", {}).get("message", resp.text)
            except Exception:
                detail = resp.text
            raise HTTPException(
                status_code=500,
                detail=f"LLM invocation failed: {resp.status_code} {detail}",
            )

        data = resp.json()
        text = data["choices"][0]["message"]["content"].strip()

        
        if text.startswith("```"):
            lines = text.split("\n")
            lines = lines[1:] if lines[0].startswith("```") else lines
            lines = lines[:-1] if lines and lines[-1].strip() == "```" else lines
            text = "\n".join(lines)

        if response_json_schema:
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                return {"raw_response": text}
        else:
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                return {"response": text}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM invocation failed: {str(e)}")


async def upload_file(file: UploadFile):
    upload_dir = settings.upload_dir
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(upload_dir, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    return {"file_url": f"/uploads/{filename}"}
