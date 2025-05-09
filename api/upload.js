import formidable from 'formidable';
import fs from 'fs';
import { put } from '@vercel/blob';

// Disable default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};
//serverless function handler
export default async function handler(req, res) {
    if (req.method !== 'POST'){
        return res.status(405).json({error: 'Method not allowed'});
    }

    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
        if (err || !files.file) {
            return res.status(400).json({ error: 'No file uploaded or parsing failed', details: err?.message });
        }

        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        const name = fields.name[0];
        const caption = fields.caption[0];
        console.log('Received file:', file);
        console.log(name);
        console.log(caption);

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
}
