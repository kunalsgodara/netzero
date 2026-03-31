from fastapi import APIRouter, Depends, UploadFile, File

from app.models.user import User
from app.schemas.integration import LLMInvokeRequest
from app.middleware.auth import get_current_user
from app.services.integration_service import invoke_llm, upload_file

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


@router.post("/llm/invoke")
async def invoke_llm_endpoint(
    data: LLMInvokeRequest,
    current_user: User = Depends(get_current_user),
):
    return await invoke_llm(data.prompt, data.response_json_schema)


@router.post("/files/upload")
async def upload_file_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    return await upload_file(file)
