# Builds the share images (Open Graph) and the app icons from Paloma's photos
from PIL import Image, ImageDraw, ImageFont, ImageOps

BG, INK, LILAC = (12, 11, 12), (238, 235, 234), (201, 162, 224)
SERIF = 'C:/Windows/Fonts/georgia.ttf'

def share(out, subtitle):
    W, H = 1200, 630
    im = Image.new('RGB', (W, H), BG)
    # An eye close-up, not a client's face, so nobody reads the photo as Paloma herself
    photo = ImageOps.fit(Image.open('img/trabajo-smokey-lila.webp').convert('RGB'), (520, H), centering=(0.62, 0.5))
    im.paste(photo, (W - 520, 0))
    d = ImageDraw.Draw(im)
    d.text((64, 200), 'Paloma', font=ImageFont.truetype(SERIF, 132), fill=INK)
    d.text((70, 370), subtitle, font=ImageFont.truetype(SERIF, 40), fill=LILAC)
    d.text((70, 440), 'WhatsApp +1 516 242 5810', font=ImageFont.truetype(SERIF, 28), fill=INK)
    im.save(out, quality=86, optimize=True, progressive=True)

def icon(out, size):
    im = Image.new('RGB', (size, size), BG)
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype(SERIF, int(size * 0.72))
    box = d.textbbox((0, 0), 'P', font=f)
    d.text(((size - (box[2] - box[0])) / 2 - box[0], (size - (box[3] - box[1])) / 2 - box[1]), 'P', font=f, fill=LILAC)
    im.save(out)

share('img/og-es.jpg', 'Maquilladora en Nueva York')
share('img/og-en.jpg', 'Makeup artist in New York')
icon('img/apple-touch-icon.png', 180)
icon('img/icon-32.png', 32)
