import express from 'express';
import formidable from 'formidable';
import { parse } from 'url';
import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';

// Disable default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

const app = express();

app.post('/api/upload', (req, res) => {
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err || !files.file) {
      return res.status(400).json({ error: 'No file uploaded or parsing failed', details: err?.message });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    console.log('Received file:', file);

    try {
        //create stream for file
        const readStream = fs.createReadStream(file.filepath);


        //transfer to vercel blob
        const blob = await put(file.originalFilename, readStream, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
            addRandomSuffix: true
        });

        console.log(blob);
    
        res.status(200).json({ message: 'File uploaded and moved', path: blob });
    } catch (moveErr) {
        console.error('Failed to move file:', moveErr);
        res.status(500).json({ error: 'Failed to move uploaded file' });
    }
  });
});

//serverless function handler
export default function handler(req, res) {
  const parsedUrl = parse(req.url, true);
  req.url = parsedUrl.pathname; // Match Express route
  app(req, res); // Pass to Express
}
