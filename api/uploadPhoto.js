import { IncomingForm } from 'formidable';
import { put } from '@vercel/blob';
import fs from 'fs';
import cors from 'cors';

export const config = {
    api: {bodyParser: false}
}

export async function handlePreflight(req, res) {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5500'); // Allows requests from any origin
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // Allowed methods
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization'); // Allowed headers
      res.setHeader('Access-Control-Allow-Credentials', 'true'); // Allow cookies
      return res.status(200).end(); // Respond to OPTIONS preflight request with status 200
    }
  }  

export default async function handler(req, res) {
    await handlePreflight(req, res);
    const form = new IncomingForm();

    form.parse(req, async(err, fields, file) => {
        if (err){
            console.error('Formidable error:', err);
            return res.status(400).json({error:'Error during file parsing', details: err.message});
        }
        if (!file.file){
            console.error('No file uploaded');
            return res.status(400).json({error: "No file uploaded"});
        }

        const stream = fs.createReadStream(file.filepath);

        const blob = await put(file.originalFilename, stream, {
            access: 'public'
        });

        res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5500');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
  

        res.status(200).json({url: blob.url});
    });
}