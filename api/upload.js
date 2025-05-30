import formidable from 'formidable';
import fs, { read } from 'fs';
import { put } from '@vercel/blob';
import { MongoClient } from 'mongodb';
import sharp from 'sharp';
import { PassThrough } from 'stream';
import moment from 'moment';
import axios from 'axios';
import https from 'https';

// Disable default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

const httpsAgent = new https.Agent({
    rejectUnauthorized: true,
})

const client = new MongoClient(process.env.MONGO_URI);
const pictureData = {
    "name": '',
    "caption": '',
    "url": '',
    "createdAt": moment().format("dddd, MMMM Do YYYY")
}

function parseForm(req){
    return new Promise((resolve, reject) => {
        const form = formidable({multiples: false});
        form.parse(req, (err, fields, files) => {
            if(err) return reject(err);
            resolve ({fields, files})
        })
    });
}

//serverless function handler
export default async function handler(req, res) {
    //CORS headers
    const allowedOrigins = [
        'http://localhost:5501',
        'http://127.0.0.1:5501',
        'https://bridgetorr17.github.io'
    ]

    const origin = req.headers.origin;
    console.log('origin header:', req.headers.origin);
    if(allowedOrigins.includes(origin)){
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if(req.method === 'OPTIONS'){
        return res.status(200).end();
    }

    if (req.method !== 'POST'){
        return res.status(405).json({error: 'Method not allowed'});
    }

    try{
        const {fields, files} = await parseForm(req);

        if(!files.file){
            return res.status(400).json({error: 'No file uploaded'});
        }

        const file = Array.isArray(files.file) ? files.file[0] : files.file;
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
        let isCat = false;
        let noCat = false;
        try{
            let response = await axios({
                method: "POST",
                url: "https://serverless.roboflow.com/cats-1dq9b/4",
                params: {
                    api_key: process.env.CAT_RECOGNITON_KEY,
                    image: blob.url,
                },
                httpsAgent
            });

            const predictions = response.data.predictions;
            console.log(predictions);
            console.log(predictions.length);

            if(predictions.length === 0) noCat = true;
            else{
                for (const item of predictions){
                    if((item.class === 'cat' || item.class === 'pepe') && item.confidence > 0.5){
                        isCat = true;
                        console.log('this is a cat');
                        break;
                    }
                }
            }
        }
        catch(err){
            console.log(err);
        }

        if(isCat){
            pictureData['name'] = fields.name[0];
            pictureData['caption'] = fields.caption[0];
            pictureData['url'] = blob.url;
            delete pictureData._id;

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
                            
            console.log('telling client we sent their cat')
            res.status(200).json({ message: 'Thank you for your post! ', path: pictureData });
        }
        else if (noCat){
            res.status(406).json({ message: 'We didn\'t find a cat in this photo...'});
        }
        else{
            console.log('not a cat');
            res.status(406).json({ message: 'Are you sure this is a cat?'});
        }
    }
    catch(err){
        console.error('Server error', err);
        return res.status(500).json({error: 'Internal server error'})
    }
}
