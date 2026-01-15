// Simple script to remind about icon generation
// In a real project, use a tool like sharp or inkscape to convert SVG to PNG

console.log(`
To generate PNG icons from the SVG, you can use:

1. Online tool: https://svgtopng.com/
2. ImageMagick: convert -background none icons/icon.svg -resize 16x16 icons/icon-16.png
3. Inkscape: inkscape icons/icon.svg -w 128 -h 128 -o icons/icon-128.png

Required sizes:
- icon-16.png (16x16)
- icon-32.png (32x32)
- icon-48.png (48x48)
- icon-128.png (128x128)
`);
