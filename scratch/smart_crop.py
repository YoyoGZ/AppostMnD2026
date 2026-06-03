import os
from PIL import Image, ImageDraw, ImageChops

def smart_crop_and_round():
    input_path = r"c:\Users\triun\AFlexe_Project\Mundial2026\public\assets\brands\hy-logo.png"
    output_path = r"c:\Users\triun\AFlexe_Project\Mundial2026\public\assets\brands\hy-logo.png"
    
    if not os.path.exists(input_path):
        print(f"[ERROR] No existe {input_path}")
        return
        
    im = Image.open(input_path)
    if im.mode != 'RGBA':
        im = im.convert('RGBA')
        
    w, h = im.size
    print(f"[INFO] Dimensiones actuales: {w}x{h}")
    
    # Vamos a buscar los limites donde empiezan los pixeles que NO son del fondo
    # Consideramos "fondo" a pixeles que son transparentes (alpha == 0)
    # o muy cercanos al blanco (R >= 245 y G >= 245 y B >= 245)
    left = w
    right = 0
    top = h
    bottom = 0
    
    for y in range(h):
        for x in range(w):
            r, g, b, a = im.getpixel((x, y))
            # Si el pixel NO es transparente y NO es blanco de fondo
            is_background = (a == 0) or (r >= 245 and g >= 245 and b >= 245)
            if not is_background:
                if x < left:
                    left = x
                if x > right:
                    right = x
                if y < top:
                    top = y
                if y > bottom:
                    bottom = y
                    
    if left < right and top < bottom:
        # Añadir un margen amigable de 15px
        margin = 15
        left = max(0, left - margin)
        top = max(0, top - margin)
        right = min(w, right + margin)
        bottom = min(h, bottom + margin)
        
        print(f"[INFO] Limites calculados con tolerancia: left={left}, top={top}, right={right}, bottom={bottom}")
        im = im.crop((left, top, right, bottom))
        print(f"[INFO] Nuevo tamaño tras smart crop: {im.size}")
    else:
        print("[WARN] No se detecto contenido recortable con los criterios de tolerancia.")
        
    # Aplicar redondeado de esquinas físico (radio proporcional)
    rad = min(im.width, im.height) // 8
    if rad < 12:
        rad = 12
    print(f"[INFO] Redondeando esquinas con radio: {rad}px...")
    
    mask = Image.new('L', im.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), im.size], radius=rad, fill=255)
    
    alpha = im.split()[3]
    alpha = ImageChops.darker(alpha, mask)
    im.putalpha(alpha)
    
    im.save(output_path, 'PNG')
    print(f"[SUCCESS] Imagen guardada en {output_path}")

if __name__ == "__main__":
    smart_crop_and_round()
