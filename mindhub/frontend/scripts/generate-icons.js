const fs = require('fs');
const { createCanvas } = require('canvas');

// Function to generate a simple MindHub icon
function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background - Sky blue gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#0ea5e9');
  gradient.addColorStop(1, '#0369a1');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // White circle background
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size*0.35, 0, Math.PI * 2);
  ctx.fill();
  
  // MindHub "M" logo
  ctx.fillStyle = '#0ea5e9';
  ctx.font = `bold ${size * 0.4}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('M', size/2, size/2);
  
  // Add subtle brain/mind symbol (simplified)
  ctx.strokeStyle = '#0369a1';
  ctx.lineWidth = size * 0.015;
  ctx.beginPath();
  ctx.arc(size/2 - size*0.1, size/2 - size*0.1, size*0.05, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(size/2 + size*0.1, size/2 - size*0.1, size*0.05, 0, Math.PI * 2);
  ctx.stroke();
  
  return canvas.toBuffer('image/png');
}

// Generate icons
try {
  console.log('Generating MindHub icons...');
  
  const icon192 = generateIcon(192);
  fs.writeFileSync('./public/icon-192x192.png', icon192);
  console.log('✓ Generated icon-192x192.png');
  
  const icon512 = generateIcon(512);
  fs.writeFileSync('./public/icon-512x512.png', icon512);
  console.log('✓ Generated icon-512x512.png');
  
  console.log('Icons generated successfully!');
} catch (error) {
  console.error('Error generating icons:', error);
  process.exit(1);
}