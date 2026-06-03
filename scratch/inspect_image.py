import os
from PIL import Image

def inspect():
    input_path = r"c:\Users\triun\AFlexe_Project\Mundial2026\public\assets\brands\hy-logo.png"
    if not os.path.exists(input_path):
        print(f"No existe {input_path}")
        return
    im = Image.open(input_path)
    print(f"Size: {im.size}, Mode: {im.mode}")
    # Inspeccionar píxeles de las 4 esquinas
    w, h = im.size
    print("Corner top-left:", im.getpixel((0, 0)))
    print("Corner top-right:", im.getpixel((w-1, 0)))
    print("Corner bottom-left:", im.getpixel((0, h-1)))
    print("Corner bottom-right:", im.getpixel((w-1, h-1)))
    
    # Contar colores o ver si hay canal alfa
    if im.mode == 'RGBA':
        alphas = [im.getpixel((x, y))[3] for x in range(w) for y in range(h)]
        zero_alphas = sum(1 for a in alphas if a == 0)
        print(f"Total pixeles: {w*h}, Pixeles transparentes (alpha=0): {zero_alphas}")

if __name__ == "__main__":
    inspect()
