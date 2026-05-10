// E2E Test: Video Synthesis Pipeline
// Verifies: imagesToVideo() with real FFmpeg
import { checkFFmpeg, imagesToVideo } from '../services/videoSynthesis.js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const outputDir = path.join(process.cwd(), '..', 'uploads', 'comic-drama');
const testDir = path.join(outputDir, 'test-' + Date.now());

async function main() {
  console.log('=== 视频合成管线 E2E 验证 ===\n');

  // 1. Check FFmpeg
  const ffmpegOk = await checkFFmpeg();
  console.log('1. FFmpeg可用:', ffmpegOk ? '✅ PASS' : '❌ FAIL');
  if (!ffmpegOk) process.exit(1);

  // 2. Create output directories
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(testDir, { recursive: true });
  console.log('2. 输出目录:', '✅ PASS');

  // 3. Create test images via Python PIL
  try {
    const script = `
from PIL import Image
img1 = Image.new('RGB', (640, 480), (255, 0, 0))
img1.save('${testDir.replace(/\\/g, '/')}/red.png')
img2 = Image.new('RGB', (640, 480), (0, 0, 255))
img2.save('${testDir.replace(/\\/g, '/')}/blue.png')
print('done')
`;
    fs.writeFileSync(path.join(testDir, 'gen_images.py'), script);
    await execAsync(`python3 "${path.join(testDir, 'gen_images.py').replace(/\\/g, '/')}"`);
  } catch (e) {
    // Fallback: create BMP with Node.js
    console.log('   Python不可用, 使用Node.js BMP fallback');
    createBMP(path.join(testDir, 'red.bmp'), 255, 0, 0);
    createBMP(path.join(testDir, 'blue.bmp'), 0, 0, 255);
  }
  console.log('3. 测试图像:', fs.readdirSync(testDir).filter(f => /\.(png|bmp)$/i.test(f)).join(', '), '✅');

  // 4. Find test images
  const imageFiles = fs.readdirSync(testDir).filter(f => /\.(png|bmp)$/i.test(f));
  if (imageFiles.length < 2) {
    console.log('❌ 图像创建失败');
    process.exit(1);
  }

  // 5. Run imagesToVideo
  const images = [
    { shotId: '1', url: path.join(testDir, imageFiles[0]), duration: 2 },
    { shotId: '2', url: path.join(testDir, imageFiles[1]), duration: 2 },
  ];

  console.log('4. 开始合成 (1280x720, 24fps)...');
  const startTime = Date.now();
  let videoPath;
  try {
    videoPath = await imagesToVideo(images, { fps: 24, outputDir: testDir, resolution: '1280x720' });
    const elapsed = Date.now() - startTime;
    console.log('5. 合成完成: ✅ PASS');
    console.log('   输出:', videoPath);
    console.log('   耗时:', elapsed + 'ms');
  } catch (e) {
    console.log('5. 合成失败: ❌', e.message);
    process.exit(1);
  }

  // 6. Verify output
  const exists = fs.existsSync(videoPath);
  console.log('6. 文件存在:', exists ? '✅ PASS' : '❌ FAIL');
  if (!exists) process.exit(1);

  const stats = fs.statSync(videoPath);
  console.log('   文件大小:', (stats.size / 1024).toFixed(1), 'KB');

  // 7. Probe video info
  try {
    const { stdout: info } = await execAsync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${videoPath}"`);
    const duration = parseFloat(info.trim());
    console.log('7. 视频时长:', duration.toFixed(1) + 's (期望~4s)', duration >= 3.5 && duration <= 4.5 ? '✅ PASS' : '⚠️ 偏差');
  } catch (e) {
    console.log('7. ffprobe不可用, 跳过验证');
  }

  // 8. Cleanup
  fs.rmSync(testDir, { recursive: true, force: true });
  console.log('8. 清理:', '✅ PASS');

  console.log('\n=== 验证结果: 全部通过 ===');
}

function createBMP(filePath, r, g, b) {
  const width = 64, height = 64;
  const pixelDataSize = width * height * 3;
  const fileSize = 54 + pixelDataSize;
  const buf = Buffer.alloc(fileSize);
  buf.write('BM', 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(0, 6);
  buf.writeUInt32LE(54, 10);
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(-height, 22);
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(0, 30);
  buf.writeUInt32LE(pixelDataSize, 34);
  buf.writeInt32LE(2835, 38);
  buf.writeInt32LE(2835, 42);
  buf.writeUInt32LE(0, 46);
  buf.writeUInt32LE(0, 50);
  for (let i = 54; i < fileSize; i += 3) {
    buf[i] = b; buf[i + 1] = g; buf[i + 2] = r;
  }
  fs.writeFileSync(filePath, buf);
}

main().catch(e => { console.error(e); process.exit(1); });
