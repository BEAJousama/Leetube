import dotenv from 'dotenv';
dotenv.config({ path: 'env' });
import { OpenSubtitlesService } from './src/services/external/opensubtitles.service';
import * as fs from 'fs';

async function test() {
  const svc = new OpenSubtitlesService();
  const res = await svc.fetchAndSaveSubtitles(550, 'en');
  console.log("Saved at:", res);
  if (res && fs.existsSync(res)) {
    console.log("File size:", fs.statSync(res).size);
  }
}
test();
