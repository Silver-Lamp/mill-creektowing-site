import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateDefaultLogo(cityName, outputDir) {
  try {
    const width = 512;
    const height = 512;
    
    // Create a complete SVG logo with city name overlay
    const svgLogo = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background circle -->
        <circle cx="${width/2}" cy="${height/2}" r="${width/2.2}" fill="#1a4789"/>
        
        <!-- Tow truck icon -->
        <path d="M384 96H256V144C256 152.8 248.8 160 240 160H208C199.2 160 192 152.8 192 144V96H128C119.2 96 112 88.84 112 80V48C112 39.16 119.2 32 128 32H384C392.8 32 400 39.16 400 48V80C400 88.84 392.8 96 384 96zM381.2 160H384V264C384 277.3 373.3 288 360 288H352V320C352 337.7 337.7 352 320 352H288C270.3 352 256 337.7 256 320V288H224C206.3 288 192 273.7 192 256V224C192 206.3 206.3 192 224 192H256V160H192V192H160C142.3 192 128 177.7 128 160V128H96C78.33 128 64 113.7 64 96V64C64 46.33 78.33 32 96 32H128V64H96V96H128V128H160V96H192V128H224V96H256V128H288V96H320V128H352V96H384V128H352V160H381.2z" fill="white" transform="scale(0.7) translate(150, 150)"/>
        
        <!-- TOWING text -->
        <text
          x="50%"
          y="75%"
          text-anchor="middle"
          style="
            font-family: 'Arial Black', sans-serif;
            font-weight: 900;
            font-size: 48px;
            fill: white;
            text-transform: uppercase;
            letter-spacing: 1px;
          "
        >TOWING</text>
      </svg>
    `;

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Convert SVG to PNG
    await sharp(Buffer.from(svgLogo))
      .resize(256, 256)  // Resize to a reasonable size for web use
      .toFile(path.join(outputDir, 'logo.png'));

    // Convert SVG to WebP
    await sharp(Buffer.from(svgLogo))
      .resize(256, 256)  // Resize to a reasonable size for web use
      .webp()
      .toFile(path.join(outputDir, 'logo.webp'));

    console.log('Generated default logo with city name overlay');
    return true;
  } catch (error) {
    console.error('Error generating default logo:', error);
    throw error;
  }
}

export { generateDefaultLogo }; 