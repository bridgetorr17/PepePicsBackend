import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URI);

export default async function handler(req, res){
    //CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if(req.method === 'OPTIONS'){
        return res.status(200).end();
    }

    if (req.method !== 'GET'){
        return res.status(405).json({error: 'Method not allowed'});
    }

    try{
        await client.connect();

        let photosCollection = client.db('PepePics').collection('pictureData');
        let photoData = await photosCollection.find()
            .sort({_id: -1})
            .toArray();
        res.status(200).json(photoData);
    }
    catch(error){
        console.error(error)
    }
    finally{
        await client.close();
    }
}