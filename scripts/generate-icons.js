const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/icon.svg');
const svg = fs.readFileSync(svgPath);

const sizes = [192, 512];

async function generateIcons() {
  for (const size of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, `../public/icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }
}

generateIcons().catch(console.error);
