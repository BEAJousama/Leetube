import type { Request, Response, NextFunction } from "express";
import { getService } from "@/shared/core/service-container";
import { TorrentService } from "@/services/torrent.service";
import { MovieService } from "@/services/movie.service";
import path from "node:path";
import fs from "fs";
import os from "os";
import { OpenSubtitlesService } from "@/services/external/opensubtitles.service";
import torrentStream from "torrent-stream";
import { logger } from "@/shared/utils/logger";
import { spawn } from "child_process";
import { getDownloadsPath } from "@/shared/utils/paths";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

type EngineMetadata = {
  fileSize: number;
  clipIndex: number;
  extension: string
};

const engines: Record<string, { engine?: any; metadata: EngineMetadata }> = {};

export class TorrentController {
  private torrentService: TorrentService;
  private subtitlesService: OpenSubtitlesService;
  private movieService: MovieService;

  constructor() {
    this.torrentService = getService<TorrentService>("TorrentService");
    this.subtitlesService = getService<OpenSubtitlesService>("OpenSubtitlesService");
    this.movieService = getService<MovieService>("MovieService");
  }

  async downloadMovie(req: Request, res: Response) {
    const { movieId, magnet, userId } = req.body;
    if (!movieId || !magnet || !userId) {
      return res.status(400).json({ error: "Missing movieId, magnet link or userId" });
    }

    const basePath = getDownloadsPath();
    const moviePath = path.join(basePath, movieId);
    if (!fs.existsSync(moviePath)) {
      fs.mkdirSync(moviePath, { recursive: true });
    }

    let engineEntry = engines[movieId];

    if (engineEntry === undefined) {
      const engine = torrentStream(magnet, { path: moviePath });
      try {
        const metadata: EngineMetadata = await new Promise((resolve, reject) => {
          engine.on("ready", () => {
            const fileSize = engine.files.reduce((sum: number, f: any) => sum + f.length, 0);
            const clipIndex = engine.files.findIndex((file: any) =>
              [".mkv", ".mp4", ".webm"].some((ext) => file.name.toLowerCase().endsWith(ext))
            );
            if (clipIndex === -1) {
              reject(new Error("Torrent contains no supported video type"));
              return;
            }
            engine.files[clipIndex].select();

            engine.on("download", async () => {
              const downloaded = engine.swarm.downloaded;
              const total = fileSize;
              const progress = downloaded / total;
              const progressPercent = Math.round(progress * 100);
              logger.info(`Download progress: ${progressPercent}% (${downloaded}/${total} bytes)`);
            });

            resolve({ fileSize, clipIndex, extension: path.extname(engine.files[clipIndex].name) });
          });

          engine.on("error", (err: Error) => {
            reject(err);
          });
        });

        engines[movieId] = { engine, metadata };
        engineEntry = engines[movieId];
      } catch (error: any) {
        engine.destroy(() => {});
        try {
          await fs.promises.unlink(moviePath);
        } catch (unlinkError) {
          logger.error(`Failed to cleanup moviePath: ${unlinkError}`);
        }
        return res.status(404).json({ message: error.message });
      }
    }

    const downloaded = engineEntry.engine.swarm.downloaded;
    const total = Number(engineEntry.metadata.fileSize);
    const isMovieDownloaded = downloaded >= total;
    if (isMovieDownloaded) {
      await this.movieService.markMovieAsDownloaded(movieId);
    }

    // Subtitles are now fetched on-demand via the /subtitles proxy endpoint.

    // Wait for initial buffering (2MB) with timeout
    const startTime = Date.now();
    const timeout = 30000; // 30 seconds
    const requiredBytes = 2 * 1024 * 1024; // 2MB

    while (engineEntry.engine.swarm.downloaded < requiredBytes) {
      if (Date.now() - startTime > timeout) {
        return res.status(408).json({ 
          error: "Timeout waiting for initial download buffer",
          downloaded: engineEntry.engine.swarm.downloaded,
          required: requiredBytes
        });
      }
      // Wait 1 second before rechecking
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Prepare torrent metadata for movie import
    const torrentMetadata = {
      downloadPath: moviePath,
      fileSize: BigInt(engineEntry.metadata.fileSize),
      downloaded: false,
      downloading: true,
      downloadProgress: 0.0,
      lastAccessed: new Date()
    };

    let internalMovieId: string;
    try {
      const importedMovie = await this.movieService.importMovieFromExternalWithTorrentData(
        parseInt(movieId),
        torrentMetadata,
        userId
      );
      internalMovieId = importedMovie.id;
    } catch (error) {
      logger.warn("Failed to import movie with torrent data, using fallback:", error);
      try {
        const importedMovie = await this.movieService.importMovieFromExternal(parseInt(movieId));
        internalMovieId = importedMovie.id;
        // Update with torrent metadata separately
        await this.movieService.updateMovieTorrentData(internalMovieId, torrentMetadata);
      } catch (fallbackError) {
        logger.warn("Failed standard import, using findOrCreate fallback:", fallbackError);
        const movie = await this.movieService.findOrCreateMovieByExternalId(movieId);
        internalMovieId = movie.id;
        // Update with torrent metadata separately
        await this.movieService.updateMovieTorrentData(internalMovieId, torrentMetadata);
      }
    }

    await this.movieService.markMovieAsWatched(userId, internalMovieId);

    return res.status(200).json({ message: "success", metadata: engineEntry.metadata });
  }

  /** Stream movie content - converts MKV to MP4 on-the-fly */
  async stream(req: Request, res: Response) {
    const movieId = req.query.movieId as string;
    if (!movieId) return res.status(400).json({ error: "Missing movieId" });

    const engineEntry = engines[movieId];
    if (!engineEntry)
      return res.status(404).json({ error: "Movie not found" });

    try {
      const movie = await this.movieService.findOrCreateMovieByExternalId(movieId);
      await this.movieService.updateMovieLastAccessed(movie.id);
      
      // // If userId is available, track user engagement and mark as watched
      // if (userId) {
      //   await this.movieService.markMovieAsWatched(userId, movie.id);
      //   logger.info(`User ${userId} started streaming movie ${movieId}`);
      // }
    } catch (error) {
      logger.warn(`Failed to update lastAccessed for movie ${movieId}:`, error);
    }

    const { engine, metadata } = engineEntry;
    const clipIndex = metadata.clipIndex;

    if (clipIndex === -1)
      return res.status(404).json({ error: "No video file found" });

    const file = engine.files[clipIndex];
    
    // Wait for at least 5MB to be downloaded
    const downloaded = engine.swarm.downloaded;
    const progressPercent = Math.round((downloaded / metadata.fileSize) * 100);

    logger.info(`Downloaded => ${downloaded} bytes; progress => ${progressPercent}%; movieId ${movieId};`);
    if (path.extname(file.name) !== ".mkv")
      return await this.streamSupported(req, res, file);

    return await this.streamMkvDirectly(req, res, file);
  }

  // Stream supported movies like mp4, webm (need to handle webm)
  private async streamSupported(req: Request, res: Response, file: any) {
    const fileSize = file.length;
    const rangeHeader = req.headers.range;

    let start = 0;
    let end;

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const startParsed = parseInt(parts[0], 10);
      const endParsed = parts[1] ? parseInt(parts[1], 10) : undefined;
      
      if (!isNaN(startParsed)) start = startParsed;
      
      if (endParsed !== undefined && !isNaN(endParsed)) {
        end = endParsed;
      } else {
        // Fallback to chunk size if no end specified
        end = start + CHUNK_SIZE;
      }
    } else {
      end = fileSize - 1;
    }
    
    // Ensure end doesn't exceed file size
    end = Math.min(end, fileSize - 1);
    
    // If range is completely invalid
    if (start >= fileSize) {
      res.status(416).json({ error: "Requested range not satisfiable" });
      return;
    }

    const chunkSize = end - start + 1;

    const isDownload = req.query.download === "true";
    const headers: Record<string, string | number> = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
    };
    if (isDownload) {
      headers["Content-Disposition"] = `attachment; filename="${file.name || 'movie.mp4'}"`;
    }
    res.writeHead(206, headers);

    const stream = file.createReadStream({ start, end });
    
    stream.on("error", (err: Error) => {
      logger.error("Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Streaming error" });
      }
    });

    stream.on("end", () => {
      logger.info(`Finished streaming bytes ${start}-${end} for movie ${file.name}`);
    });

    stream.pipe(res);
  }

  /**
   * Stream MKV to MP4 using raw FFmpeg spawn
   * Converts on-the-fly and streams directly to browser
   */
  private async streamMkvDirectly(req: Request, res: Response, file: any) {
    const inputStream = file.createReadStream();
    let ffmpegProcess: any = null;
    let hasStarted = false;
    let isCleaningUp = false;
    
    // Cleanup helper to prevent multiple cleanups
    const cleanup = (reason: string) => {
      if (isCleaningUp) return;
      isCleaningUp = true;
      
      logger.info(`[Cleanup] Initiating cleanup: ${reason}`);
      
      // Destroy input stream
      if (inputStream && !inputStream.destroyed) {
        inputStream.destroy();
      }
      
      // Kill FFmpeg process
      if (ffmpegProcess && !ffmpegProcess.killed) {
        ffmpegProcess.kill("SIGKILL");
      }
      
      // End response if not already ended
      if (res && !res.writableEnded) {
        res.end();
      }
    };

    // Set headers immediately
    const isDownload = req.query.download === "true";
    const headers: Record<string, string> = {
      "Content-Type": "video/mp4",
      "Transfer-Encoding": "chunked",
      "Accept-Ranges": "none",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    };
    if (isDownload) {
      headers["Content-Disposition"] = `attachment; filename="movie.mp4"`;
    }
    res.writeHead(200, headers);

    // FFmpeg arguments for fast conversion
    const ffmpegArgs = [
      "-i", "pipe:0",                    // Input from stdin
      "-movflags", "frag_keyframe+empty_moov+faststart",
      "-f", "mp4",                       // Output format
      "-preset", "ultrafast",            // Fastest preset
      "-tune", "zerolatency",            // Zero latency
      "-crf", "28",                      // Quality (23-28 range)
      "-maxrate", "800k",                // Limit bitrate
      "-bufsize", "1600k",
      "-vf", "scale=854:480",            // Scale to 480p
      "-r", "24",                        // 24 fps
      "-c:v", "libx264",                 // H.264 video
      "-c:a", "aac",                     // AAC audio
      "-b:a", "96k",                     // Audio bitrate
      "-ac", "2",                        // Stereo
      "-ar", "44100",                    // Audio sample rate
      "-avoid_negative_ts", "make_zero",
      "pipe:1"                           // Output to stdout
    ];

    logger.info(`[FFmpeg] Starting direct stream`);

    ffmpegProcess = spawn("ffmpeg", ffmpegArgs, {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let errorOutput = "";

    // Pipe torrent stream to FFmpeg input
    inputStream.pipe(ffmpegProcess.stdin);

    // Handle input stream errors
    inputStream.on("error", (err: Error) => {
      logger.error(`[Input Stream] Error: ${err.message}`);
      cleanup("Input stream error");
    });

    // Handle input stream end (torrent download completed)
    inputStream.on("end", () => {
      logger.info("[Input Stream] Ended normally");
    });

    // Handle FFmpeg stdin errors
    ffmpegProcess.stdin.on("error", (err: Error) => {
      // Ignore EPIPE errors (FFmpeg closed stdin early)
      if (err.message.includes("EPIPE")) {
        logger.debug("[FFmpeg stdin] EPIPE error (expected on early termination)");
        return;
      }
      logger.error(`[FFmpeg stdin] Error: ${err.message}`);
      cleanup("FFmpeg stdin error");
    });

    // Pipe FFmpeg output to response
    ffmpegProcess.stdout.on("data", (chunk: Buffer) => {
      if (!hasStarted) {
        logger.info(`[FFmpeg] First chunk received (${chunk.length} bytes) - streaming started!`);
        hasStarted = true;
      }
      
      // Handle write backpressure
      if (!res.write(chunk)) {
        ffmpegProcess.stdout.pause();
        res.once("drain", () => {
          ffmpegProcess.stdout.resume();
        });
      }
    });

    ffmpegProcess.stdout.on("end", () => {
      logger.info("[FFmpeg] Output stream ended");
      if (!res.writableEnded) {
        res.end();
      }
    });

    ffmpegProcess.stdout.on("error", (err: Error) => {
      logger.error(`[FFmpeg stdout] Error: ${err.message}`);
      cleanup("FFmpeg stdout error");
    });

    // Log FFmpeg errors/progress
    ffmpegProcess.stderr.on("data", (data: Buffer) => {
      const line = data.toString();
      errorOutput += line;
      
      // Log progress frames periodically (every 100 frames)
      if (line.includes("frame=")) {
        const frameMatch = line.match(/frame=\s*(\d+)/);
        if (frameMatch && parseInt(frameMatch[1]) % 100 === 0) {
          logger.debug(`[FFmpeg] ${line.trim()}`);
        }
      }
      
      if (line.toLowerCase().includes("error")) {
        logger.error(`[FFmpeg] ${line.trim()}`);
      }
    });

    // Handle FFmpeg process errors
    ffmpegProcess.on("error", (err: Error) => {
      logger.error(`[FFmpeg] Process error: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({ error: "FFmpeg error" });
      }
      cleanup("FFmpeg process error");
    });

    ffmpegProcess.on("close", (code: number | null, signal: string | null) => {
      if (code !== 0 && code !== null) {
        logger.error(`[FFmpeg] Exited with code ${code}`);
        if (errorOutput) {
          logger.error(`[FFmpeg] Last error output: ${errorOutput.slice(-500)}`);
        }
      } else if (signal) {
        logger.info(`[FFmpeg] Killed by signal: ${signal}`);
      } else {
        logger.info(`[FFmpeg] Completed successfully`);
      }
      
      if (!res.writableEnded) {
        res.end();
      }
    });

    // Handle client disconnect
    req.on("close", () => {
      logger.info("[Client] Disconnected, cleaning up resources");
      cleanup("Client disconnect");
    });

    // Handle response errors (e.g., client network issues)
    res.on("error", (err: Error) => {
      logger.error(`[Response] Error: ${err.message}`);
      cleanup("Response error");
    });

    // Handle response finish
    res.on("finish", () => {
      logger.info("[Response] Finished successfully");
    });

    // Timeout if no output after 30 seconds
    const timeout = setTimeout(() => {
      if (!hasStarted) {
        logger.error("[FFmpeg] Timeout - no output after 30 seconds");
        if (!res.headersSent) {
          res.status(500).json({ error: "Stream timeout" });
        }
        cleanup("Timeout");
      }
    }, 30000);

    // Clear timeout once streaming starts
    ffmpegProcess.stdout.once("data", () => {
      clearTimeout(timeout);
    });
  }

  /** Stop torrent download and cleanup disk */
  async stopDownload(req: Request, res: Response) {
    const { movieId } = req.query as { movieId: string };

    if (!movieId) return res.status(400).json({ error: "Missing movieId" });

    const engineEntry = engines[movieId];

    if (!engineEntry || !engineEntry.engine) {
      return res
        .status(200)
        .json({ message: `Download for ${movieId} was not active or already stopped.` });
    }

    try {
      const engine = engineEntry.engine;
      engine.destroy();

      delete engines[movieId];
      logger.info(`Torrent engine for ${movieId} successfully stopped.`);

      const basePath = getDownloadsPath();
      const moviePath = path.join(basePath, movieId);

      if (fs.existsSync(moviePath)) {
        await fs.promises.rm(moviePath, { recursive: true, force: true });
        logger.info(`Deleted movie path for ${movieId} at ${moviePath}`);
      }

      // Update the movie database to say it's no longer downloading
      const movie = await this.movieService.findOrCreateMovieByExternalId(movieId);
      if (movie && movie.id) {
        await this.movieService.resetMovieDownloadState(movie.id);
      }

      res.status(200).json({ message: `Download for ${movieId} stopped and files cleaned up.` });
    } catch (error) {
      logger.error(`Error destroying engine for ${movieId}:`, error);
      res.status(500).json({ error: "Failed to stop torrent engine and cleanup." });
    }
  }

  /** On-demand subtitle proxy */
  async getSubtitle(req: Request, res: Response) {
    const { movieId, language } = req.params;

    if (!movieId || !language) {
      return res.status(400).json({ message: "Movie ID and language are required" });
    }

    try {
      // 1. Check if we already have it downloaded
      let subtitlePath = await this.subtitlesService.getSavedSubtitlePath(
        movieId,
        language as "en" | "es" | "fr" | "de" | "ar"
      );

      // 2. If not downloaded, fetch it right now!
      if (!subtitlePath) {
        logger.info(`Subtitle not found locally. Fetching on-demand for ${movieId} (${language})`);
        const downloaded = await this.subtitlesService.fetchAndSaveSubtitles(
          parseInt(movieId, 10),
          language as "en" | "es" | "fr" | "de" | "ar"
        );
        
        if (downloaded) {
          subtitlePath = await this.subtitlesService.getSavedSubtitlePath(
            movieId,
            language as "en" | "es" | "fr" | "de" | "ar"
          );
        }
      }

      // 3. Send the file if we have it
      if (subtitlePath && fs.existsSync(subtitlePath)) {
        res.setHeader("Content-Type", "text/vtt");
        // Use read stream to pipe the file
        const stream = fs.createReadStream(subtitlePath);
        stream.pipe(res);
      } else {
        res.status(404).send("Subtitle not found");
      }
    } catch (error) {
      logger.error("Error in on-demand subtitle proxy:", error);
      return res.status(500).send("Error fetching subtitle");
    }
  }
}