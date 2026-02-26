import { Injectable, Logger } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';

const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');

@Injectable()
export class VideoProcessorService {
    private readonly logger = new Logger(VideoProcessorService.name);

    constructor() {
        ffmpeg.setFfmpegPath(ffmpegStatic);
        ffmpeg.setFfprobePath(ffprobeStatic.path);
    }

    private readonly qualities = [
        { name: 'P4K', height: 2160, maxBitrate: '15000k' },
        { name: 'P1080', height: 1080, maxBitrate: '5000k' },
        { name: 'P720', height: 720, maxBitrate: '2500k' },
        { name: 'P480', height: 480, maxBitrate: '1000k' },
        { name: 'P360', height: 360, maxBitrate: '700k' },
        { name: 'P240', height: 240, maxBitrate: '400k' },
    ];

    async getVideoMetadata(inputPath: string): Promise<{ width: number; height: number }> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(inputPath, (err, metadata) => {
                if (err) return reject(err);

                const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                if (!videoStream) {
                    return reject(new Error('No video stream found'));
                }

                resolve({
                    width: videoStream.width || 0,
                    height: videoStream.height || 0,
                });
            });
        });
    }

    async processVideo(
        inputPath: string,
        outputDir: string,
        slug: string,
    ): Promise<Array<{ quality: string; fileUrl: string }>> {
        const { height: originalHeight } = await this.getVideoMetadata(inputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const targetQualities = this.qualities.filter(q => q.height <= originalHeight || this.qualities.indexOf(q) === this.qualities.length - 1); // always include at least the lowest if the video is extremely small


        const generatedFiles: Array<{ quality: string; fileUrl: string }> = [];

        for (const quality of targetQualities) {
            this.logger.log(`Starting conversion to ${quality.name} (Height: ${quality.height}p) for ${slug}...`);

            const fileName = `${quality.name.toLowerCase()}.mp4`;
            const outputPath = path.join(outputDir, fileName);
            const relativeUrl = `/uploads/movies/${slug}/${fileName}`;

            await this.convertToQuality(inputPath, outputPath, quality.height, quality.maxBitrate);

            this.logger.log(`Finished conversion to ${quality.name}`);
            generatedFiles.push({
                quality: quality.name,
                fileUrl: relativeUrl,
            });
        }

        return generatedFiles;
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
