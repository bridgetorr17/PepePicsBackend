import formidable from 'formidable';
import fs from 'fs';
import { put } from '@vercel/blob';
import { MongoClient } from 'mongodb';

// Disable default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

const client = new MongoClient(process.env.MONGO_URI);
const pictureData = {
    "name": '',
    "caption": '',
    "url": ''
}

//serverless function handler
export default async function handler(req, res) {
    //CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if(req.method === 'OPTIONS'){
        return res.status(200).end();
    }

    if (req.method !== 'POST'){
        return res.status(405).json({error: 'Method not allowed'});
    }

    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
        if (err || !files.file) {
            return res.status(400).json({ error: 'No file uploaded or parsing failed', details: err?.message });
        }

        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        pictureData['name'] = fields.name[0];
        pictureData['caption'] = fields.caption[0];
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

            console.log(blob.url);
            pictureData['url'] = blob.url;
        
            try{
                await client.connect();

                let photosCollection = client.db('PepePics').collection('pictureData');
                await photosCollection.insertOne(pictureData);
                console.log('inserted photo data')
            }
            catch(error){
                console.error(error);
            }
            finally{
                await client.close();
            }
            res.status(200).json({ message: 'File uploaded and moved', path: pictureData });
        } catch (moveErr) {
            console.error('Failed to move file:', moveErr);
            res.status(500).json({ error: 'Failed to move uploaded file' });
        }
    });
}
