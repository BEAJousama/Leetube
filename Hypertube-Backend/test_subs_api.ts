import axios from 'axios';
import * as fs from 'fs';

async function test() {
  const apiKey = "0Hifi3eNjykzpD89f14qGj3EtCrxzXtB";
  const tmdbId = 550;
  
  try {
    const res = await axios.get('https://api.opensubtitles.com/api/v1/subtitles', {
      params: { tmdb_id: tmdbId, languages: 'en', type: 'movie' },
      headers: { 'Api-Key': apiKey, 'User-Agent': 'leetube', 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
    console.log("Found subtitles:", res.data.data.length);
    if (res.data.data.length > 0) {
      const fileId = res.data.data[0].attributes.files[0].file_id;
      console.log("File ID:", fileId);
      
      const downloadRes = await axios.post('https://api.opensubtitles.com/api/v1/download', {
        file_id: fileId
      }, {
        headers: { 'Api-Key': apiKey, 'User-Agent': 'leetube', 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });
      
      console.log("Download link:", downloadRes.data.link);
      
      const subContent = await axios.get(downloadRes.data.link, { responseType: 'text' });
      console.log("Subtitle first 100 chars:", subContent.data.substring(0, 100));
    }
  } catch (err: any) {
    if (err.response) {
      console.error("Error status:", err.response.status);
      console.error("Error data:", err.response.data);
    } else {
      console.error("Error:", err.message);
    }
  }
}
test();
