import { OpenSubtitlesService } from './src/services/external/opensubtitles.service';
import dotenv from 'dotenv';
dotenv.config();

const svc = new OpenSubtitlesService();
svc.fetchAndSaveSubtitles(550, 'en')
  .then(res => console.log('Result:', res))
  .catch(err => console.error('Error:', err));
