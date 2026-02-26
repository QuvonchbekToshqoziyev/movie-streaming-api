import { Injectable, Logger } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';
import { MovieQuality } from '@prisma/client';

const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');

@Injectable()
export class VideoProcessorService {
  private readonly logger = new Logger(VideoProcessorService.name);

  constructor() {
    ffmpeg.setFfmpegPath(ffmpegStatic);
    ffmpeg.setFfprobePath(ffprobeStatic.path);
  }

  private readonly qualities: Array<{
    quality: MovieQuality;
    height: number;
    maxBitrate: string;
  }> = [
    { quality: MovieQuality.P4K, height: 2160, maxBitrate: '15000k' },
    { quality: MovieQuality.P1080, height: 1080, maxBitrate: '5000k' },
    { quality: MovieQuality.P720, height: 720, maxBitrate: '2500k' },
    { quality: MovieQuality.P480, height: 480, maxBitrate: '1000k' },
    { quality: MovieQuality.P360, height: 360, maxBitrate: '700k' },
    { quality: MovieQuality.P240, height: 240, maxBitrate: '400k' },
  ];

  async getVideoMetadata(
    inputPath: string,
  ): Promise<{ width: number; height: number; duration: number }> {
    if (!inputPath) throw new Error('ffprobe inputPath is empty');
    if (!fs.existsSync(inputPath))
      throw new Error(`ffprobe inputPath not found: ${inputPath}`);

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) return reject(err);

        const videoStream = metadata.streams.find(
          (s) => s.codec_type === 'video',
        );

        if (!videoStream) return reject(new Error('No video stream found'));

        resolve({
          width: (videoStream as any).width || 0,
          height: (videoStream as any).height || 0,
          duration: Math.round((metadata.format as any).duration ?? 0),
        });
      });
    });
  }

  async processVideo(
    inputPath: string,
    outputDir: string,
    slug: string,
  ): Promise<Array<{ quality: MovieQuality; fileUrl: string }>> {
    const { height: originalHeight } = await this.getVideoMetadata(inputPath);

    fs.mkdirSync(outputDir, { recursive: true });

    const eligible = this.qualities.filter((q) => q.height <= originalHeight);
    const targetQualities =
      eligible.length > 0 ? eligible : [this.qualities[this.qualities.length - 1]];

    const generatedFiles: Array<{ quality: MovieQuality; fileUrl: string }> = [];

    for (const q of targetQualities) {
      this.logger.log(`Converting ${slug} to ${q.quality} (${q.height}p)`);

      const fileName = `${q.quality.toLowerCase()}.mp4`;
      const outputPath = path.join(outputDir, fileName);
      const relativeUrl = `/uploads/movies/${slug}/${fileName}`;

      await this.convertToQuality(inputPath, outputPath, q.height, q.maxBitrate);

      generatedFiles.push({ quality: q.quality, fileUrl: relativeUrl });
      this.logger.log(`Done ${slug}: ${q.quality}`);
    }

    return generatedFiles;
  }

  getClosestQuality(height: number): MovieQuality {
    return this.qualities.reduce((prev, curr) =>
      Math.abs(curr.height - height) < Math.abs(prev.height - height) ? curr : prev,
    ).quality;
  }

  private convertToQuality(
    inputPath: string,
    outputPath: string,
    height: number,
    maxBitrate: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          `-vf scale=-2:${height}`,
          '-c:v libx264',
          '-preset fast',
          `-maxrate ${maxBitrate}`,
          `-bufsize ${maxBitrate}`,
          '-threads 0',
          '-c:a aac',
          '-b:a 128k',
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }
}