#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont

def create_icon(size):
    # Create image with sky blue background
    img = Image.new('RGBA', (size, size), '#0ea5e9')
    draw = ImageDraw.Draw(img)
    
    # Draw white circle
    circle_radius = size * 0.35
    circle_bbox = [
        size/2 - circle_radius,
        size/2 - circle_radius,
        size/2 + circle_radius,
        size/2 + circle_radius
    ]
    draw.ellipse(circle_bbox, fill='white')
    
    # Draw "M" in the center
    try:
        font_size = int(size * 0.4)
        # Try to use a system font, fallback to default if not available
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        # Use default font if system font not available
        font = ImageFont.load_default()
    
    # Draw text
    text = "M"
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    text_x = (size - text_width) / 2
    text_y = (size - text_height) / 2 - text_bbox[1]
    draw.text((text_x, text_y), text, fill='#0ea5e9', font=font)
    
    return img

# Create icons
try:
    icon_192 = create_icon(192)
    icon_192.save('./public/icon-192x192.png')
    print('Created icon-192x192.png')
    
    icon_512 = create_icon(512)
    icon_512.save('./public/icon-512x512.png')
    print('Created icon-512x512.png')
    
    print('Icons created successfully!')
except Exception as e:
    print(f'Error: {e}')