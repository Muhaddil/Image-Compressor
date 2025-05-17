import { compressImage, imageTypes } from 'simple-image-compressor';
import { maxSize } from '@/variables/constants';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import type { FileObj } from '@/types/file';

const ffmpeg = createFFmpeg({
  log: true,
  logger: ({ type, message }) => {
    if (type === 'fferr' && message.includes('frame=')) {
      console.log(message);
    }
  },
});

(async () => {
  try {
    await ffmpeg.load();
    console.log('FFmpeg cargado correctamente.');
  } catch (error) {
    console.error('Error al cargar FFmpeg:', error);
  }
});

export async function compressFile(file: File, fileObj: FileObj, quality: number = 1, updateProgress?: (progress: number) => void): Promise<File> {
  if (file.size < maxSize) return file;

  const fileType = file.type.split('/')[0];

  if (fileType === 'image') {
    const type = imageTypes.JPEG;
    const newFileExtension = type.split('/').at(-1);
    const res = await compressImage(file, { quality, type });
    const lowerQuality = quality - 0.05;

    if (res.size > maxSize) {
      return await compressFile(file, fileObj, lowerQuality, updateProgress);
    }

    const fileName = file.name.split('.').slice(0, -1).join('.');
    const newFileName = `${fileName}-min.${newFileExtension}`;

    fileObj.isCompressed = true;

    return new File([res], newFileName, { type });
  } else if (fileType === 'video') {
    try {
      if (!ffmpeg.isLoaded()) await ffmpeg.load();
      const inputFileName = file.name;
      const outputFileName = 'compressed.mp4';

      ffmpeg.FS('writeFile', inputFileName, await fetchFile(file));

      await ffmpeg.run(
        '-i', inputFileName,                // Nombre del archivo de entrada
        '-vcodec', 'libx264',               // Usamos el códec H.264
        '-pix_fmt', 'yuv420p',              // Usamos YUV420p para compatibilidad
        '-acodec', 'aac',                   // Usamos el códec AAC para el audio
        '-crf', '28',                       // Control de calidad
        '-preset', 'slow',                  // Ajuste la velocidad de compresión
        '-threads', '2',                    // Ajuste la velocidad de compresión
        '-vf', 'scale=1920:1080',           // Redimensiona el video a 1080p
        outputFileName                      // Nombre del archivo de salida
      );

      const data = ffmpeg.FS('readFile', outputFileName);

      const compressedFile = new File(
        [data.buffer as ArrayBuffer],
        `${file.name.split('.').slice(0, -1).join('.')}-min.mp4`,
        { type: 'video/mp4' }
      );

      fileObj.isCompressed = true;

      return compressedFile;
    } catch (error) {
      fileObj.isError = true;
      console.error('Video compression failed:', error);
      // Optionally, return the original file or throw a custom error
      // return file;
      throw new Error('Video compression failed. The file may be too large or your device may not have enough memory.');
    }
  } else {
    throw new Error('Unsupported file type');
  }
}
