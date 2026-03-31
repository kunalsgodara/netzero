import os
import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import google.generativeai as genai

from app.models import User
from app.schemas import LLMInvokeRequest
from app.auth import get_current_user
from app.config import get_settings

router = APIRouter(prefix="/api/integrations", tags=["integrations"])
settings = get_settings()


@router.post("/llm/invoke")
async def invoke_llm(
    data: LLMInvokeRequest,
    current_user: User = Depends(get_current_user),
):
    """Proxy to Google Gemini LLM. Accepts a prompt and optional JSON schema, returns structured JSON."""
    if not settings.gemini_api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel("gemini-2.0-flash")

    # Build the prompt — if a JSON schema is provided, instruct the model to reply as JSON
    prompt = data.prompt
    if data.response_json_schema:
        prompt += (
            "\n\nIMPORTANT: You MUST respond with valid JSON only, no markdown fences, no extra text. "
            f"The JSON must conform to this schema:\n{json.dumps(data.response_json_schema, indent=2)}"
        )

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Strip markdown code fences if present
        if text.startswith("```"):
            # Remove ```json\n ... \n```
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines)

        # Try to parse as JSON
        if data.response_json_schema:
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                # Return as-is if not valid JSON
                return {"raw_response": text}
        else:
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                return {"response": text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM invocation failed: {str(e)}")


@router.post("/files/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload a file to local storage. Returns the file URL."""
    upload_dir = settings.upload_dir
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(upload_dir, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    file_url = f"/uploads/{filename}"
    return {"file_url": file_url}
