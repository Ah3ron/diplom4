from pydantic import BaseModel


class ExportRequest(BaseModel):
    format: str
    report_type: str
    filters: dict = {}
