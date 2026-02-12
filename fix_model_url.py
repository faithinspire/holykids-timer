#!/usr/bin/env python3
import re

# Read the file
with open('app/staff/face-enrollment/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the MODEL_URL line
content = content.replace(
    "const MODEL_URL = '/models'",
    "const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models'"
)

# Write back
with open('app/staff/face-enrollment/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed MODEL_URL in face-enrollment page")
