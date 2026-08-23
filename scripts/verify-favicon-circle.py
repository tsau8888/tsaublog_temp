from pathlib import Path

from PIL import Image


favicon_path = Path(__file__).resolve().parent.parent / "app" / "favicon.ico"

with Image.open(favicon_path) as favicon:
    for frame in range(getattr(favicon, "n_frames", 1)):
        favicon.seek(frame)
        image = favicon.convert("RGBA")
        width, height = image.size
        corner_alphas = [
            image.getpixel((0, 0))[3],
            image.getpixel((width - 1, 0))[3],
            image.getpixel((0, height - 1))[3],
            image.getpixel((width - 1, height - 1))[3],
        ]
        center_alpha = image.getpixel((width // 2, height // 2))[3]

        if any(corner_alphas) or center_alpha == 0:
            raise ValueError(f"Invalid circular favicon frame: {width}x{height}")

        print(f"Verified {width}x{height}: transparent corners and visible center")
