# Paloma, maquillaje profesional

Página web de Paloma, maquilladora chilena en Nueva York: novias, maquillaje social, alisados y clases de automaquillaje.

Es un sitio estático (HTML, CSS y JavaScript, sin compilación). El labial 3D usa Three.js desde jsDelivr.

- `index.html`: versión principal, en español.
- `en/index.html`: versión en inglés. **No se edita a mano**: se genera desde `index.html` con `python scripts/make_en.py`, que tiene la traducción de cada texto. Si cambias un texto en español, agrega su traducción en ese script y vuelve a correrlo.
- `rosa/`: primera versión, en rosa y berenjena (fuera de los buscadores).
- `img/`: fotos de Paloma en WebP, con versiones `-800` para celular.

## Verla en local

```bash
python -m http.server 5180
```

Luego abre http://localhost:5180.

## Antes de publicar

Los precios son de lanzamiento y, junto con horarios, zonas de atención y textos sobre su forma de trabajar, hay que confirmarlos con Paloma. Las reservas van por WhatsApp (+1 516 242 5810). La foto de Brooklyn es de Danny Lyon (1974, dominio público, vía Wikimedia Commons).
