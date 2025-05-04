export default function handler(req, res) {
    if (req.method === 'POST') {
        console.log(req.file);
        res.status(200).json({ name: 'bridget' });
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}