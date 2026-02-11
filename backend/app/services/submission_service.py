"""
Juryline -- Submission Service
Dynamic validation of form_data against form_fields, and enrichment
of stored submissions with human-readable labels for display.
"""

from datetime import datetime
from fastapi import HTTPException
from app.supabase_client import supabase


class SubmissionService:
    """Validates and enriches submissions against dynamic form schemas."""

    async def validate_form_data(self, event_id: str, form_data: dict):
        """Validate submitted form_data against the event's form_fields schema."""
        fields_result = (
            supabase.table("form_fields")
            .select("*")
            .eq("event_id", event_id)
            .order("sort_order")
            .execute()
        )
        fields = fields_result.data or []

        if not fields:
            raise HTTPException(400, "Event has no form fields defined")

        errors: list[str] = []

        for field in fields:
            fid = field["id"]
            value = form_data.get(fid)
            ftype = field["field_type"]
            label = field["label"]

            # Check required
            if field["is_required"] and (
                value is None or value == "" or value == []
            ):
                errors.append(f"{label} is required")
                continue

            if value is None:
                continue  # Optional and not provided

            # Type-specific validation
            match ftype:
                case "short_text":
                    if not isinstance(value, str):
                        errors.append(f"{label} must be text")
                    elif field.get("validation"):
                        v = field["validation"]
                        if v.get("max_length") and len(value) > v["max_length"]:
                            errors.append(
                                f"{label} exceeds {v['max_length']} characters"
                            )

                case "long_text":
                    if not isinstance(value, str):
                        errors.append(f"{label} must be text")

                case "number":
                    if not isinstance(value, (int, float)):
                        errors.append(f"{label} must be a number")
                    elif field.get("validation"):
                        v = field["validation"]
                        if v.get("min") is not None and value < v["min"]:
                            errors.append(f"{label} must be >= {v['min']}")
                        if v.get("max") is not None and value > v["max"]:
                            errors.append(f"{label} must be <= {v['max']}")

                case "url":
                    if not isinstance(value, str) or not value.startswith("http"):
                        errors.append(f"{label} must be a valid URL")

                case "email":
                    if not isinstance(value, str) or "@" not in value:
                        errors.append(f"{label} must be a valid email")

                case "dropdown" | "multiple_choice":
                    options = field.get("options", [])
                    if isinstance(options, list) and value not in options:
                        errors.append(f"{label}: invalid option '{value}'")

                case "checkboxes":
                    options = field.get("options", [])
                    if not isinstance(value, list):
                        errors.append(f"{label} must be a list")
                    elif isinstance(options, list) and not all(
                        v in options for v in value
                    ):
                        errors.append(f"{label}: invalid option(s)")

                case "file_upload":
                    if not isinstance(value, list):
                        errors.append(f"{label} must be a list of file URLs")

                case "date":
                    try:
                        datetime.fromisoformat(str(value))
                    except (ValueError, TypeError):
                        errors.append(f"{label} must be a valid date")

                case "linear_scale":
                    opts = field.get("options", {})
                    if isinstance(opts, dict):
                        min_val = opts.get("min", 1)
                        max_val = opts.get("max", 10)
                    else:
                        min_val, max_val = 1, 10
                    if not isinstance(value, (int, float)) or not (
                        min_val <= value <= max_val
                    ):
                        errors.append(
                            f"{label} must be between {min_val} and {max_val}"
                        )

        # Check for unknown fields
        known_ids = {f["id"] for f in fields}
        for key in form_data:
            if key not in known_ids:
                errors.append(f"Unknown field: {key}")

        if errors:
            raise HTTPException(400, detail={"errors": errors})

    async def enrich_for_display(self, submission: dict) -> dict:
        """Add form_data_display with field labels and types for frontend."""
        fields_result = (
            supabase.table("form_fields")
            .select("*")
            .eq("event_id", submission["event_id"])
            .order("sort_order")
            .execute()
        )

        display = []
        for field in fields_result.data or []:
            display.append(
                {
                    "field_id": field["id"],
                    "label": field["label"],
                    "field_type": field["field_type"],
                    "value": submission.get("form_data", {}).get(field["id"]),
                }
            )

        submission["form_data_display"] = display
        return submission


submission_service = SubmissionService()
