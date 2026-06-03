import os
from PIL import Image, ImageDraw, ImageChops

def trim_and_round_logo():
    input_path = r"c:\Users\triun\AFlexe_Project\Mundial2026\public\assets\brands\hy-logo.png"
    output_path = r"c:\Users\triun\AFlexe_Project\Mundial2026\public\assets\brands\hy-logo.png"
    
    if not os.path.exists(input_path):
        print(f"[ERROR] No se encontro la imagen en {input_path}")
        return
        
    print(f"[INFO] Abriendo imagen original: {input_path}")
    im = Image.open(input_path)
    print(f"       Tamaño original: {im.size}, Modo: {im.mode}")
    
    # 1. Convertir a RGBA si no lo está para soportar transparencia
    if im.mode != 'RGBA':
        im = im.convert('RGBA')
        
    # 2. Autocrop / Trim de espacio blanco o transparente redundante
    # Si la imagen tiene fondo blanco, la recortamos comparando con una imagen blanca solida
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    
    if bbox:
        print(f"[INFO] Recortando espacio blanco redundante a la caja: {bbox}")
        # Le damos un pequeño margen de 15px
        margin = 15
        left = max(0, bbox[0] - margin)
        top = max(0, bbox[1] - margin)
        right = min(im.width, bbox[2] + margin)
        bottom = min(im.height, bbox[3] + margin)
        im = im.crop((left, top, right, bottom))
        print(f"       Nuevo tamaño tras recorte: {im.size}")
    else:
        print("[INFO] No se detecto espacio blanco recortable.")
        
    # 3. Aplicar bordes redondeados fisicos en el PNG
    rad = min(im.width, im.height) // 8 # Radio de redondeo proporcional
    if rad < 10:
        rad = 10
    print(f"[INFO] Redondeando esquinas con radio: {rad}px...")
    
    # Crear mascara de esquinas redondeadas
    mask = Image.new('L', im.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), im.size], radius=rad, fill=255)
    
    # Aplicar la mascara al canal alfa
    alpha = im.split()[3]
    alpha = ImageChops.darker(alpha, mask)
    im.putalpha(alpha)
    
    # 4. Guardar la imagen optimizada
    im.save(output_path, 'PNG')
    print(f"[SUCCESS] Imagen procesada con exito y guardada en {output_path}!")

if __name__ == "__main__":
    trim_and_round_logo()
