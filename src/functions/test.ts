// import { compressImage, imageTypes } from 'simple-image-compressor';
// import { maxSize } from '@/variables/constants';
// import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

// // Crear la instancia de FFmpeg con configuraciones básicas
// const ffmpeg = createFFmpeg({
//   log: true,
//   logger: ({ type, message }) => {
//     if (type === 'fferr' && message.includes('frame=')) {
//       console.log(message); // Para depurar el progreso de FFmpeg
//     }
//   },
// });

// (async () => {
//   try {
//     await ffmpeg.load();
//     console.log('FFmpeg cargado correctamente.');
//   } catch (error) {
//     console.error('Error al cargar FFmpeg:', error);
//   }
// });

// export async function compressFile(file: File, fileObj: FileObj, quality: number = 1, updateProgress?: (progress: number) => void): Promise<File> {
//   if (file.size < maxSize) return file;

//   const fileType = file.type.split('/')[0];

//   if (fileType === 'image') {
//     const type = imageTypes.JPEG;
//     const newFileExtension = type.split('/').at(-1);
//     const res = await compressImage(file, { quality, type });
//     const lowerQuality = quality - 0.05;

//     if (res.size > maxSize) {
//       return await compressFile(file, fileObj, lowerQuality, updateProgress);
//     }

//     const fileName = file.name.split('.').slice(0, -1).join('.');
//     const newFileName = `${fileName}-min.${newFileExtension}`;

//     // Actualiza el estado de isCompressed en fileObj
//     fileObj.isCompressed = true;

//     return new File([res], newFileName, { type });
//   } else if (fileType === 'video') {
//     if (!ffmpeg.isLoaded()) await ffmpeg.load();
//     const inputFileName = file.name;
//     const outputFileName = 'compressed.mp4';

//     // Escribe el archivo en el sistema de archivos virtual de FFmpeg
//     ffmpeg.FS('writeFile', inputFileName, await fetchFile(file));

//     await ffmpeg.run(
//       '-i', inputFileName,                // Nombre del archivo de entrada
//       '-vcodec', 'libx264',               // Usamos el códec H.264
//       '-pix_fmt', 'yuv420p',              // Usamos YUV420p para compatibilidad
//       '-acodec', 'aac',                   // Usamos el códec AAC para el audio
//       '-crf', '23',                       // Control de calidad
//       '-preset', 'fast',             // Ajuste la velocidad de compresión
//       '-threads', '6',                    // Ajuste la velocidad de compresión
//       '-vf', 'scale=1280:720',            // Redimensiona el video a 720p
//       outputFileName                      // Nombre del archivo de salida
//     );

//     const data = ffmpeg.FS('readFile', outputFileName);

//     const compressedFile = new File(
//       [data.buffer as ArrayBuffer],
//       `${file.name.split('.').slice(0, -1).join('.')}-min.mp4`,
//       { type: 'video/mp4' }
//     );

//     // Actualizar el estado de isCompressed en fileObj
//     fileObj.isCompressed = true;

//     return compressedFile;
//   } else {
//     throw new Error('Unsupported file type');
//   }
// }














// import { compressImage, imageTypes } from 'simple-image-compressor';
// import { maxSize } from '@/variables/constants';
// import { FFmpeg } from '@ffmpeg/ffmpeg';
// import { fetchFile } from '@ffmpeg/util';
// import type { FileObj } from '@/types/file';

// const ffmpeg = new FFmpeg();

// ffmpeg.on('log', ({ type, message }) => {
//   if (type === 'fferr') {
//     console.log(message);
//   }
// });

// (async () => {
//   try {
//     await ffmpeg.load();
//     console.log('FFmpeg cargado correctamente.');
//   } catch (error) {
//     console.error('Error al cargar FFmpeg:', error);
//   }
// })();

// export async function compressFile(file: File, fileObj: FileObj, quality: number = 1, updateProgress?: (progress: number) => void): Promise<File> {
//   if (file.size < maxSize) return file;

//   const fileType = file.type.split('/')[0];

//   if (fileType === 'image') {
//     const type = imageTypes.JPEG;
//     const newFileExtension = type.split('/').at(-1);
//     const res = await compressImage(file, { quality, type });
//     const lowerQuality = quality - 0.05;

//     if (res.size > maxSize) {
//       return await compressFile(file, fileObj, lowerQuality, updateProgress);
//     }

//     const fileName = file.name.split('.').slice(0, -1).join('.');
//     const newFileName = `${fileName}-min.${newFileExtension}`;

//     fileObj.isCompressed = true;

//     return new File([res], newFileName, { type });
//   } else if (fileType === 'video') {
//     const ffmpeg = new FFmpeg();
//     await ffmpeg.load();
//     const inputFileName = file.name;
//     const outputFileName = 'compressed.mp4';

//     await ffmpeg.writeFile(inputFileName, await fetchFile(file));

//     await ffmpeg.exec([
//       '-i', inputFileName,                // Nombre del archivo de entrada
//       '-vcodec', 'libx264',               // Usamos el códec H.265
//       '-pix_fmt', 'yuv420p',              // Usamos YUV420p para compatibilidad
//       '-acodec', 'aac',                   // Usamos el códec AAC para el audio
//       '-crf', '28',                       // Control de calidad
//       '-preset', 'medium',                // Ajuste la velocidad de compresión
//       '-vf', 'scale=1280:720',            // Redimensiona el video a 720p
//       '-threads', '8',                     // Ajuste la velocidad de compresión
//       outputFileName                      // Nombre del archivo de salida
//     ]);

//     const data = await ffmpeg.readFile(outputFileName);

//     // Check if data is a string (base64)
//     if (typeof data === 'string') {
//       // Decode base64 string to a binary string and then into a Uint8Array
//       const binaryString = atob(data);
//       const bufferData = new ArrayBuffer(binaryString.length);
//       const uint8Array = new Uint8Array(bufferData);

//       for (let i = 0; i < binaryString.length; i++) {
//         uint8Array[i] = binaryString.charCodeAt(i);
//       }

//       // Create a File with ArrayBuffer
//       const compressedFile = new File(
//         [bufferData],  // ArrayBuffer can be used as BlobPart
//         `${file.name.split('.').slice(0, -1).join('.')}-min.mp4`,
//         { type: 'video/mp4' }
//       );

//       return compressedFile;
//     } else if (data instanceof Uint8Array) {
//       // If data is already a Uint8Array, use the buffer directly
//       const compressedFile = new File(
//         [data.buffer as ArrayBuffer],  // Use data.buffer casted as ArrayBuffer
//         `${file.name.split('.').slice(0, -1).join('.')}-min.mp4`,
//         { type: 'video/mp4' }
//       );

//       return compressedFile;
//     } else {
//       throw new Error('Unexpected file data format');
//     }
//   }
// }