from pathlib import Path

from PIL import Image, ImageDraw


project_root = Path(__file__).resolve().parent.parent
source = project_root / "public" / "avatar.webp"
destination = project_root / "app" / "favicon.ico"

canvas_size = 256
favicon_size = 32

with Image.open(source) as image:
    avatar = image.convert("RGBA").resize(
        (canvas_size, canvas_size),
        Image.Resampling.LANCZOS,
    )
    circle_mask = Image.new("L", (canvas_size, canvas_size), 0)
    ImageDraw.Draw(circle_mask).ellipse(
        (0, 0, canvas_size - 1, canvas_size - 1),
        fill=255,
    )
    avatar.putalpha(circle_mask)
    avatar.resize((favicon_size, favicon_size), Image.Resampling.LANCZOS).save(
        destination,
        format="ICO",
        sizes=[(16, 16), (32, 32)],
    )

print(f"Created {destination.relative_to(project_root)}")
