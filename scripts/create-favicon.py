from pathlib import Path

from PIL import Image


project_root = Path(__file__).resolve().parent.parent
source = project_root / "public" / "avatar.webp"
destination = project_root / "app" / "favicon.ico"

with Image.open(source) as image:
    image.convert("RGBA").resize((32, 32), Image.Resampling.LANCZOS).save(
        destination,
        format="ICO",
        sizes=[(16, 16), (32, 32)],
    )

print(f"Created {destination.relative_to(project_root)}")

