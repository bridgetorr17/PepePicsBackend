import formidable from 'formidable';
import fs, { read } from 'fs';
import { put } from '@vercel/blob';
import { MongoClient } from 'mongodb';
import sharp from 'sharp';
import { PassThrough } from 'stream';
import moment from 'moment';
import axios from 'axios';

// Disable default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

console.log(moment().format("dddd, MMMM Do YYYY"))

const client = new MongoClient(process.env.MONGO_URI);
const pictureData = {
    "name": '',
    "caption": '',
    "url": '',
    "createdAt": moment().format("dddd, MMMM Do YYYY")
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

        try{
            const readableStream = fs.createReadStream(file.filepath);

            //resize image
            const resize = sharp()
                .rotate()
                .resize(800)
                .jpeg({ quality : 70 })

            const optimizeStream = readableStream
                .pipe(resize);

            const pass = new PassThrough()
            optimizeStream.pipe(pass);

            //upload image to blob
            const blob = await put(file.originalFilename, pass, {
                access: 'public',
                token: process.env.BLOB_READ_WRITE_TOKEN,
                addRandomSuffix: true
            });
        
            //test model if this is a cat
            axios({
                method: "POST",
                url: "https://serverless.roboflow.com/cats-1dq9b/4",
                params: {
                    api_key: process.env.CAT_RECOGNITON_KEY,
                    image: blob.url,
                }
            })
            .then(function(response) {
                console.log(response.data);
            })
            .catch(function(error) {
                console.log(error);
            });

            pictureData['name'] = fields.name[0];
            pictureData['caption'] = fields.caption[0];
            pictureData['url'] = blob.url;
            console.log('Received file:', file);
            
            //upload photo and associated fields to mongodb
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
        }
        catch (moveErr) {
            console.error('Failed to move file:', moveErr);
            res.status(500).json({ error: 'Image procesing or upload failed' });
        }
    });
}
