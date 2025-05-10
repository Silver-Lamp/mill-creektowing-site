import generateLogo from './generate-logo.js';
import fs from 'fs';
import path from 'path';

async function testLogoGeneration() {
  try {
    // Create a test directory
    const testDir = path.join(process.cwd(), 'test-output');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Test with a simple city name
    console.log('Testing logo generation with "Test City"...');
    await generateLogo('Test City', testDir);

    // Verify the output files exist
    const pngPath = path.join(testDir, 'logo-custom.png');
    const webpPath = path.join(testDir, 'logo-custom.webp');

    if (fs.existsSync(pngPath) && fs.existsSync(webpPath)) {
      console.log('✅ Logo generation successful!');
      console.log('Generated files:');
      console.log(`- ${pngPath}`);
      console.log(`- ${webpPath}`);
    } else {
      console.error('❌ Logo generation failed: Output files not found');
    }
  } catch (error) {
    console.error('❌ Logo generation failed:', error);
  }
}

// Run the test
testLogoGeneration(); 