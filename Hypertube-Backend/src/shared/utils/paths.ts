import os from 'os';
import path from 'path';

const isProd = process.env.NODE_ENV === 'production';

export const getDownloadsPath = () => {
  return isProd ? path.join(os.tmpdir(), 'leetube-downloads') : path.join(process.cwd(), 'downloads');
};

export const getUploadsPath = () => {
  return isProd ? path.join(os.tmpdir(), 'leetube-uploads') : path.join(process.cwd(), 'uploads');
};
