# Builds the share images (Open Graph), the app icons and the print files from Paloma's photos
import io, os
import segno
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

def business_card(out, url):
    # 3.5 x 2 in at 300 dpi plus 0.125 in of bleed per side; keep text 110 px from the edge
    W, H = 1125, 675
    front = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(front)
    d.text((110, 170), 'Paloma', font=ImageFont.truetype(SERIF, 150), fill=INK)
    d.text((116, 355), 'Maquilladora · Makeup artist', font=ImageFont.truetype(SERIF, 42), fill=LILAC)
    d.text((116, 420), 'Queens, New York', font=ImageFont.truetype(SERIF, 34), fill=INK)

    back = Image.new('RGB', (W, H), BG)
    png = io.BytesIO()
    # Dark on light with its quiet zone: phones often can't read a light-on-dark code
    segno.make(url, error='m').save(png, kind='png', scale=9, border=3, dark=BG, light=INK)
    qr = Image.open(png)
    back.paste(qr, (110, (H - qr.height) // 2))
    d = ImageDraw.Draw(back)
    x = 110 + qr.width + 50
    for y, text, size, color in [
        (170, 'Reserva por WhatsApp', 36, LILAC), (222, 'Book on WhatsApp', 30, INK),
        (300, '+1 (516) 242-5810', 40, INK), (372, '@paloma.makeupprofesional', 30, INK),
        (440, 'Escanea para ver mi trabajo', 30, LILAC),
    ]:
        d.text((x, y), text, font=ImageFont.truetype(SERIF, size), fill=color)
        assert x + d.textlength(text, font=ImageFont.truetype(SERIF, size)) <= W - 75, text
    front.save(out, save_all=True, append_images=[back], resolution=300, quality=95)

def gift_card(out, title, fields, foot):
    # Blank on purpose: Paloma writes on it with WhatsApp's editor. No expiry date, so NY's gift card expiry rules don't come into play
    W, H = 1200, 675
    im = Image.new('RGB', (W, H), BG)
    im.paste(ImageOps.fit(Image.open('img/trabajo-smokey-lila.webp').convert('RGB'), (440, H), centering=(0.62, 0.5)), (W - 440, 0))
    d = ImageDraw.Draw(im)
    d.text((64, 56), 'Paloma', font=ImageFont.truetype(SERIF, 40), fill=LILAC)
    d.text((64, 110), title, font=ImageFont.truetype(SERIF, 64), fill=INK)
    for i, label in enumerate(fields):
        y = 262 + i * 76
        d.text((64, y), label, font=ImageFont.truetype(SERIF, 28), fill=LILAC)
        d.line((210, y + 32, 700, y + 32), fill=INK, width=2)
    d.text((64, 590), foot, font=ImageFont.truetype(SERIF, 26), fill=INK)
    im.save(out)

share('img/og-es.jpg', 'Maquilladora en Nueva York')
share('img/og-en.jpg', 'Makeup artist in New York')
icon('img/apple-touch-icon.png', 180)
icon('img/icon-32.png', 32)

# Print files stay out of the repo: a public blank gift card could be forged
os.makedirs('print', exist_ok=True)
business_card('print/tarjetas-presentacion.pdf', 'https://jonathaanbl.github.io/paloma-makeup-web/')  # change to the domain once bought
gift_card('print/tarjeta-regalo-es.png', 'Tarjeta de regalo', ['Para', 'De', 'Servicio', 'Código'], 'Reserva por WhatsApp: +1 516 242 5810')
gift_card('print/tarjeta-regalo-en.png', 'Gift card', ['For', 'From', 'Service', 'Code'], 'Book on WhatsApp: +1 516 242 5810')
