/**
 * 字幕生成服务
 * 支持SRT和VTT格式
 */

/**
 * 生成SRT格式字幕
 * @param {Array} subtitles - 字幕数组 [{startTime, endTime, text}]
 * @returns {string} SRT格式字符串
 */
export function generateSRT(subtitles) {
  if (!subtitles || subtitles.length === 0) {
    return '';
  }

  let srtContent = '';
  
  subtitles.forEach((subtitle, index) => {
    const startTime = formatTime(subtitle.startTime);
    const endTime = formatTime(subtitle.endTime);
    
    srtContent += `${index + 1}\n`;
    srtContent += `${startTime} --> ${endTime}\n`;
    srtContent += `${subtitle.text}\n\n`;
  });

  return srtContent.trim();
}

/**
 * 生成VTT格式字幕（WebVTT）
 * @param {Array} subtitles - 字幕数组 [{startTime, endTime, text}]
 * @returns {string} VTT格式字符串
 */
export function generateVTT(subtitles) {
  if (!subtitles || subtitles.length === 0) {
    return 'WEBVTT\n';
  }

  let vttContent = 'WEBVTT\n\n';
  
  subtitles.forEach((subtitle, index) => {
    const startTime = formatTimeVTT(subtitle.startTime);
    const endTime = formatTimeVTT(subtitle.endTime);
    
    vttContent += `${index + 1}\n`;
    vttContent += `${startTime} --> ${endTime}\n`;
    vttContent += `${subtitle.text}\n\n`;
  });

  return vttContent.trim();
}

/**
 * 从分镜脚本提取字幕数据
 * @param {object} storyboard - 分镜脚本对象
 * @returns {Array} 字幕数组
 */
export function extractSubtitlesFromStoryboard(storyboard) {
  const subtitles = [];
  let currentTime = 0;

  storyboard.scenes.forEach(scene => {
    scene.shots.forEach(shot => {
      if (shot.dialogue && shot.dialogue.trim()) {
        const duration = shot.duration || 3; // 默认3秒
        
        subtitles.push({
          startTime: currentTime,
          endTime: currentTime + duration,
          text: shot.dialogue,
          shotId: shot.shot_id,
          character: shot.character,
        });

        currentTime += duration;
      } else {
        // 无台词的镜头，只增加时间
        currentTime += shot.duration || 3;
      }
    });
  });

  return subtitles;
}

/**
 * 格式化时间为SRT时间格式 (HH:MM:SS,mmm)
 */
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.round((seconds % 1) * 1000);

  return `${padZero(hours, 2)}:${padZero(minutes, 2)}:${padZero(secs, 2)},${padZero(millis, 3)}`;
}

/**
 * 格式化时间为VTT时间格式 (HH:MM:SS.mmm)
 */
function formatTimeVTT(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.round((seconds % 1) * 1000);

  return `${padZero(hours, 2)}:${padZero(minutes, 2)}:${padZero(secs, 2)}.${padZero(millis, 3)}`;
}

/**
 * 补零函数
 */
function padZero(num, length) {
  return num.toString().padStart(length, '0');
}

/**
 * 调整字幕时间轴（与音频同步）
 * @param {Array} subtitles - 原始字幕数组
 * @param {Array} audioDurations - 音频时长数组 [{shotId, duration}]
 * @returns {Array} 调整后的字幕数组
 */
export function syncSubtitlesWithAudio(subtitles, audioDurations) {
  const durationMap = {};
  audioDurations.forEach(item => {
    durationMap[item.shotId] = item.duration;
  });

  let currentTime = 0;
  const syncedSubtitles = subtitles.map(subtitle => {
    const actualDuration = durationMap[subtitle.shotId] || subtitle.endTime - subtitle.startTime;

    const synced = {
      ...subtitle,
      startTime: currentTime,
      endTime: currentTime + actualDuration,
    };
    currentTime += actualDuration;
    return synced;
  });

  return syncedSubtitles;
}
