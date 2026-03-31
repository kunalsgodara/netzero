import os
import json
import uuid

from fastapi import HTTPException, UploadFile
import google.generativeai as genai

from app.config.settings import get_settings

settings = get_settings()


async def invoke_llm(prompt: str, response_json_schema: dict = None):
    if not settings.gemini_api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel("gemini-2.0-flash")

    full_prompt = prompt
    if response_json_schema:
        full_prompt += (
            "\n\nIMPORTANT: You MUST respond with valid JSON only, no markdown fences, no extra text. "
            f"The JSON must conform to this schema:\n{json.dumps(response_json_schema, indent=2)}"
        )

    try:
        response = model.generate_content(full_prompt)
        text = response.text.strip()

        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
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
