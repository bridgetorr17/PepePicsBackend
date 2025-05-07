import express from 'express';
import fileUpload from 'express-fileupload';
import { parse } from 'url';

export const config = {
    api: {
      bodyParser: false,
    },
  };  

const app = express();

app.use(fileUpload());

app.post('api/upload', (req, res) => {
    console.log(req.headers)
    if (!req.files || Object.keys(req.files) === 0){
        return res.status(400).send('No files were uploaded');
    }

    const uploadedFile = req.files.myFile;
    const uploadPath = __dirname + '/uploads/' + uploadedFile.name;

    console.log('upload path will be ' + uploadPath);

    uploadedFile.mv(uploadPath, (err) => {
        if (err) {
            return res.status(500).send(err);
        }

        res.send('file uploaded successfully');
    })
})

export default function handler(req, res){
    const parsedUrl = parse(req.url, true);
    req.url = parsedUrl.pathname;
    app(req, res);
}

// app.listen(3000, () => {
//     console.log('listening on port 3000');
// })