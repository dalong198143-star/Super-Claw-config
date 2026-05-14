import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * FFmpeg视频合成服务
 * 将图像序列、音频、字幕合成为最终视频
 */

/**
 * 检查FFmpeg是否安装
 */
export async function checkFFmpeg() {
  return new Promise((resolve) => {
    exec('ffmpeg -version', (error) => {
      resolve(!error);
    });
  });
}

/**
 * 将图像序列合成为视频（每张图固定画面，不插值不失真）
 * @param {Array} images - 图像数组 [{shotId, url, duration}]
 * @param {object} options - 配置选项
 * @returns {Promise<string>} 视频文件路径
 */
export async function imagesToVideo(images, options = {}) {
  const {
    fps = 24,
    outputDir = path.join(__dirname, '../../uploads/comic-drama'),
    resolution = '1280x720',
  } = options;

  const [targetW, targetH] = resolution.split('x').map(Number);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = Date.now();
  const outputFile = path.join(outputDir, `video-${timestamp}.mp4`);

  try {
    const tempDir = path.join(outputDir, `temp-${timestamp}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 1. 下载所有图像
    console.log('[FFmpeg] 开始下载图像...');
    const imagePaths = await downloadImages(images, tempDir);

    // 2. 预处理：每张图保持比例缩放+居中黑边填充，统一分辨率，杜绝拉伸失真
    console.log('[FFmpeg] 预处理图像（保持比例+黑边填充到统一分辨率）...');
    const normalizedDir = path.join(tempDir, 'normalized');
    if (!fs.existsSync(normalizedDir)) {
      fs.mkdirSync(normalizedDir, { recursive: true });
    }

    const normalizedPaths = [];
    for (let i = 0; i < imagePaths.length; i++) {
      const normalizedPath = path.join(normalizedDir, `frame_${String(i + 1).padStart(4, '0')}.png`);
      const imgDuration = images[i].duration || 3;
      await executeCommand(
        `ffmpeg -y -i "${imagePaths[i]}" -vf "scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2" "${normalizedPath}"`
      );
      normalizedPaths.push({ path: normalizedPath, duration: imgDuration });
    }

    // 3. 创建帧列表（ffmpeg 8.x: duration 作用于下一个 file，第一个 file 不能有 duration）
    // 使用分段编码方式避免 concat demuxer 与 -r 的交互问题
    const listFile = path.join(tempDir, 'frames.txt');
    const last = normalizedPaths[normalizedPaths.length - 1];
    let concatContent = `ffconcat version 1.0\nfile '${last.path}'\n`;
    for (const np of normalizedPaths) {
      concatContent += `duration ${np.duration}\nfile '${np.path}'\n`;
    }
    fs.writeFileSync(listFile, concatContent);

    console.log('[FFmpeg] 开始合成视频...');
    // 不传 -r / -vf fps，避免与 concat demuxer duration 交互导致时长膨胀
    await executeCommand(
      `ffmpeg -y -f concat -safe 0 -i "${listFile}" -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p "${outputFile}"`
    );

    cleanupTempDir(tempDir);
    console.log('[FFmpeg] 视频合成完成:', outputFile);
    return outputFile;
  } catch (error) {
    console.error('[FFmpeg] 视频合成失败:', error.message);
    throw error;
  }
}

/**
 * 添加音频到视频
 * @param {string} videoPath - 视频文件路径
 * @param {string} audioPath - 音频文件路径
 * @param {object} options - 配置选项
 * @returns {Promise<string>} 带音频的视频文件路径
 */
export async function addAudioToVideo(videoPath, audioPath, options = {}) {
  const {
    outputDir = path.dirname(videoPath),
    volume = 1.0, // 音量
  } = options;

  const timestamp = Date.now();
  const outputFile = path.join(outputDir, `video-audio-${timestamp}.mp4`);

  try {
    console.log('[FFmpeg] 开始添加音频...');

    const ffmpegCommand = `ffmpeg -y -i "${videoPath}" -i "${audioPath}" -filter:a "volume=${volume}" -c:v copy -c:a aac -b:a 128k -shortest "${outputFile}"`;

    await executeCommand(ffmpegCommand);

    console.log('[FFmpeg] 音频添加完成:', outputFile);
    return outputFile;
  } catch (error) {
    console.error('[FFmpeg] 音频添加失败:', error.message);
    throw error;
  }
}

/**
 * 添加字幕到视频
 * @param {string} videoPath - 视频文件路径
 * @param {string} subtitlePath - 字幕文件路径（SRT格式）
 * @param {object} options - 配置选项
 * @returns {Promise<string>} 带字幕的视频文件路径
 */
export async function addSubtitlesToVideo(videoPath, subtitlePath, options = {}) {
  const {
    outputDir = path.dirname(videoPath),
    fontSize = 24,
    fontColor = 'white',
    position = 'bottom', // top/center/bottom
  } = options;

  const timestamp = Date.now();
  const outputFile = path.join(outputDir, `video-sub-${timestamp}.mp4`);

  try {
    console.log('[FFmpeg] 开始添加字幕...');

    // 根据位置设置字幕垂直位置
    let yPosition;
    switch (position) {
      case 'top':
        yPosition = 'h*0.1';
        break;
      case 'center':
        yPosition = 'h*0.5';
        break;
      case 'bottom':
      default:
        yPosition = 'h*0.9';
        break;
    }

    const ffmpegCommand = `ffmpeg -y -i "${videoPath}" -vf "subtitles='${subtitlePath.replace(/\\/g, '/')}':force_style='Fontsize=${fontSize},PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Alignment=2,MarginV=20'" -c:a copy "${outputFile}"`;

    await executeCommand(ffmpegCommand);

    console.log('[FFmpeg] 字幕添加完成:', outputFile);
    return outputFile;
  } catch (error) {
    console.error('[FFmpeg] 字幕添加失败:', error.message);
    throw error;
  }
}

/**
 * 混合多个音频轨道
 * @param {Array} audioTracks - 音频轨道数组 [{path, volume, startOffset}]
 * @param {object} options - 配置选项
 * @returns {Promise<string>} 混合后的音频文件路径
 */
export async function mixAudioTracks(audioTracks, options = {}) {
  const {
    outputDir = path.join(__dirname, '../../uploads/comic-drama'),
    bgmVolume = 0.3, // 背景音乐音量
  } = options;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = Date.now();
  const outputFile = path.join(outputDir, `mixed-audio-${timestamp}.mp3`);

  try {
    console.log('[FFmpeg] 开始混合音频...');

    // 构建FFmpeg复杂滤镜
    let filterComplex = '';
    let inputs = '';

    audioTracks.forEach((track, index) => {
      inputs += `-i "${track.path}" `;
      
      if (index === 0) {
        // 第一个轨道（通常是配音）
        filterComplex += `[${index}:a]volume=${track.volume || 1.0}[a${index}];`;
      } else {
        // 背景音乐
        filterComplex += `[${index}:a]volume=${bgmVolume}[a${index}];`;
      }
    });

    // 混合所有音频轨道
    const audioInputs = audioTracks.map((_, index) => `[a${index}]`).join('');
    filterComplex += `${audioInputs}amix=inputs=${audioTracks.length}:dropout_transition=2[out]`;

    const ffmpegCommand = `ffmpeg -y ${inputs}-filter_complex "${filterComplex}" -map "[out]" "${outputFile}"`;

    await executeCommand(ffmpegCommand);

    console.log('[FFmpeg] 音频混合完成:', outputFile);
    return outputFile;
  } catch (error) {
    console.error('[FFmpeg] 音频混合失败:', error.message);
    throw error;
  }
}

/**
 * 完整的视频合成流程
 * @param {object} projectData - 项目数据
 * @returns {Promise<string>} 最终视频文件路径
 */
export async function synthesizeComicVideo(projectData) {
  const {
    images, // 图像数组
    dialogues, // 台词数组
    subtitles, // 字幕数组
    bgm, // 背景音乐（可选）
    options = {},
  } = projectData;

  console.log('[FFmpeg] 开始完整视频合成流程...');

  try {
    // Step 1: 图像序列转视频
    console.log('[FFmpeg] Step 1: 生成基础视频...');
    const baseVideo = await imagesToVideo(images, options);

    let videoWithAudio = baseVideo;

    // Step 2-4: 音频处理（仅有对话或BGM时才执行）
    const hasDialogues = dialogues && dialogues.length > 0;
    const hasBgm = !!bgm;

    if (hasDialogues || hasBgm) {
      let dialogueAudio = null;
      if (hasDialogues) {
        console.log('[FFmpeg] Step 2: 生成配音音频...');
        dialogueAudio = await generateDialogueAudio(dialogues, options);
      }

      const audioTracks = [];
      if (hasDialogues && dialogueAudio) audioTracks.push({ path: dialogueAudio, volume: 1.0 });
      if (hasBgm) audioTracks.push({ path: bgm, volume: 0.3 });

      if (audioTracks.length > 0) {
        console.log('[FFmpeg] Step 3: 混合音频...');
        const mixedAudio = audioTracks.length > 1
          ? await mixAudioTracks(audioTracks, options)
          : audioTracks[0].path;

        console.log('[FFmpeg] Step 4: 添加音频...');
        videoWithAudio = await addAudioToVideo(baseVideo, mixedAudio, options);
      } else {
        console.log('[FFmpeg] Step 2-4: 音频生成失败，使用无声视频');
        videoWithAudio = baseVideo;
      }
    } else {
      console.log('[FFmpeg] Step 2-4: 无音频，跳过');
    }

    // Step 5: 添加字幕（仅有字幕时才执行）
    let finalVideo = videoWithAudio;
    if (subtitles && subtitles.length > 0) {
      console.log('[FFmpeg] Step 5: 添加字幕...');
      const subtitleFile = await saveSubtitleFile(subtitles, options.outputDir);
      finalVideo = await addSubtitlesToVideo(videoWithAudio, subtitleFile, options);
    } else {
      console.log('[FFmpeg] Step 5: 无字幕，跳过');
    }

    console.log('[FFmpeg] ✅ 视频合成完成:', finalVideo);
    return finalVideo;
  } catch (error) {
    console.error('[FFmpeg] 视频合成失败:', error.message);
    throw error;
  }
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 下载图像到本地
 */
async function downloadImages(images, tempDir) {
  const imagePaths = [];

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const imagePath = path.join(tempDir, `frame_${String(i + 1).padStart(4, '0')}.png`);

    // 如果已经是本地路径，直接使用（支持 file://、Unix /、Windows盘符）
    if (image.url.startsWith('file://') || image.url.startsWith('/') || /^[A-Za-z]:[/\\]/.test(image.url)) {
      imagePaths.push(image.url);
      continue;
    }

    // 下载远程图像
    const response = await fetch(image.url);
    if (!response.ok) {
      throw new Error(`下载图像失败: ${image.url}`);
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(imagePath, Buffer.from(buffer));
    imagePaths.push(imagePath);
  }

  return imagePaths;
}

/**
 * 执行命令行命令
 */
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('[FFmpeg] 命令执行错误:', stderr);
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * 清理临时目录
 */
function cleanupTempDir(tempDir) {
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.warn('[FFmpeg] 清理临时文件失败:', error.message);
  }
}

/**
 * 生成配音音频 - 调用TTS服务批量生成真实语音
 */
async function generateDialogueAudio(dialogues, options) {
  const outputDir = options.outputDir || path.join(__dirname, '../../uploads/comic-drama');
  const timestamp = Date.now();
  const outputFile = path.join(outputDir, `dialogue-${timestamp}.mp3`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (!dialogues || dialogues.length === 0) {
    console.log('[FFmpeg] 无台词，跳过音频');
    return null;
  }

  try {
    const { batchGenerateSpeech } = await import('./tts.js');
    const results = await batchGenerateSpeech(dialogues, {
      engine: options.ttsEngine || 'azure',
      voice: options.ttsVoice,
    });

    const successResults = results.filter(r => r.success);
    if (successResults.length === 0) {
      console.warn('[FFmpeg] TTS全部失败，跳过音频');
      return null;
    }

    const tempDir = path.join(outputDir, `tts-${timestamp}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const audioFiles = [];
    for (let i = 0; i < successResults.length; i++) {
      const r = successResults[i];
      const audioPath = path.join(tempDir, `audio_${String(i + 1).padStart(4, '0')}.mp3`);

      if (r.audioUrl.startsWith('data:audio/')) {
        const base64Data = r.audioUrl.split(',')[1];
        fs.writeFileSync(audioPath, Buffer.from(base64Data, 'base64'));
      } else if (r.audioUrl.startsWith('http')) {
        const response = await fetch(r.audioUrl);
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(audioPath, Buffer.from(buffer));
      } else {
        fs.copyFileSync(r.audioUrl, audioPath);
      }
      audioFiles.push(audioPath);
    }

    if (audioFiles.length === 1) {
      fs.copyFileSync(audioFiles[0], outputFile);
    } else {
      const listFile = path.join(tempDir, 'concat.txt');
      const listContent = audioFiles.map(f => `file '${f}'`).join('\n');
      fs.writeFileSync(listFile, listContent);
      await executeCommand(
        `ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${outputFile}"`
      );
    }

    cleanupTempDir(tempDir);
    console.log('[FFmpeg] TTS配音生成完成:', outputFile);
    return outputFile;
  } catch (error) {
    console.error('[FFmpeg] TTS配音生成失败:', error.message);
    fs.writeFileSync(outputFile, '');
    return outputFile;
  }
}

/**
 * 保存字幕文件
 */
async function saveSubtitleFile(subtitles, outputDir) {
  const { generateSRT } = await import('./subtitle.js');
  
  const srtContent = generateSRT(subtitles);
  const timestamp = Date.now();
  const subtitleFile = path.join(outputDir || path.join(__dirname, '../../uploads/comic-drama'), `subtitles-${timestamp}.srt`);
  
  fs.writeFileSync(subtitleFile, srtContent, 'utf-8');
  
  return subtitleFile;
}
