# app/utils.py

from typing import Optional
import uuid
import os
import re

def determine_question_type(
    option_a: Optional[str],
    option_b: Optional[str],
    option_c: Optional[str],
    option_d: Optional[str],
) -> str:
    options = [option_a, option_b, option_c, option_d]
    has_options = any(opt and opt.strip() for opt in options)
    return "objective" if has_options else "theory"


def safe_filename(original_filename: str, prefix: str = "") -> str:
    """
    Generate a safe, unique filename using UUID and cleaned prefix.
    Ensures no space or special character issues in URL or filesystem.
    """
    ext = os.path.splitext(original_filename)[1].lower()
    clean_prefix = re.sub(r'[^a-zA-Z0-9_]', '', prefix.replace(' ', '_')).lower()
    return f"{uuid.uuid4().hex}_{clean_prefix}{ext}"
