# Welcome to Pepe Pics Backend <img src="https://github.com/user-attachments/assets/d90cc53f-530b-4122-8649-863669b9b971" alt="logo" width="30"/>

This project was inspired be a very lovable cat, Pepe. I wanted to make a site where family and friends could upload photos of Pepe to share widely. It has turned into a photo sharing app where all cats are welcome!

## How it works

The frontend is located in a separate repository and hosted on github pages. Navigate to <a href="https://bridgetorr17.github.io/PepePicsApp/">https://bridgetorr17.github.io/PepePicsApp/</a>. Here you will find all the cats previously
posted by users. If you would like to make a post, click "Post a feline friend" and fill out the information.

The submission will upload your photo to vercel blob, use AI image recognition to verify that the photo contains a cat, and then add the image to the feed.

## Technologies used
- Node.js is used for building out the API. GET and PUT requests are made from client side devices and handled effectively.
  - PUT request
    - Processed with node modules formidable and sharp
    - Photo is uploaded to the blob
    - Photo is processed with the cat recognition model
    - If the photo is of a cat, it is inserted into the database
    - Page is refreshed with new photo
- Vercel is used to host the backend code at <a href="https://pepe-pics-backend.vercel.app/">https://pepe-pics-backend.vercel.app/</a>. Serverless functions are used to easily integrate into the vercel ecosystem.
- Vercel Blob is used for saving images on the cloud. Each image is assigned a unique url at upload. 
- Roboflow was used to train the cat recognition model, and also hosts the deployment of the model. The blob url is posted via axios, and the model returns the classes found, with their confidence percentages.
  - There are two classes in this model, cat and not_cat.
  - mAP@50 71.7%, Precision 74.6%, Recall 70.4%
  - <a href="https://serverless.roboflow.com/cats-1dq9b/4">https://serverless.roboflow.com/cats-1dq9b/4<a>
- MongoDB Atlas is used to store the cat content. The name, caption, and unique blob url is stored for each submission, if the model determins the photo is of a cat.
- HTML/CSS/JS is used for the frontend
