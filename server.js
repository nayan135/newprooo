require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const shortid = require('shortid');
const mailjet = require('node-mailjet').apiConnect(process.env.MAILJET_API_KEY, process.env.MAILJET_SECRET_KEY);

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    shortId: String,
    date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/submit-name', async (req, res) => {
    try {
        const userName = req.body.name;
        const userEmail = req.body.email;
        const shortId = shortid.generate();
        const newUser = new User({ name: userName, email: userEmail, shortId: shortId });
        await newUser.save();

        // Send email notification to the first user
        const firstUser = await User.findOne({}, {}, { sort: { 'date': 1 } });
        if (firstUser) {
            const request = mailjet.post("send", { 'version': 'v3.1' }).request({
                "Messages": [{
                    "From": {
                        "Email": "your-email@example.com",
                        "Name": "Your Name"
                    },
                    "To": [{
                        "Email": firstUser.email,
                        "Name": firstUser.name
                    }],
                    "Subject": "New User Notification",
                    "TextPart": `Hello ${firstUser.name}, a new user named ${userName} has joined.`,
                    "HTMLPart": `<h3>Hello ${firstUser.name},</h3><p>A new user named ${userName} has joined.</p>`
                }]
            });
            await request;
        }

        res.json({ shortId });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/submit-response', async (req, res) => {
    try {
        const { shortId, response } = req.body;
        const user = await User.findOne({ shortId: shortId });
        if (user) {
            const request = mailjet.post("send", { 'version': 'v3.1' }).request({
                "Messages": [{
                    "From": {
                        "Email": "nayan135@night-owls.tech",
                        "Name": "Your Name"
                    },
                    "To": [{
                        "Email": user.email,
                        "Name": user.name
                    }],
                    "Subject": "Valentine Response",
                    "TextPart": `Hello ${user.name}, your response is: ${response}.`,
                    "HTMLPart": `<h3>Hello ${user.name},</h3><p>Your response is: ${response}.</p>`
                }]
            });
            await request;
            res.sendStatus(200);
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/main', async (req, res) => {
    try {
        const shortId = req.query.shortId;
        const user = await User.findOne({ shortId: shortId });
        if (user) {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/get-name', async (req, res) => {
    try {
        const shortId = req.query.shortId;
        const user = await User.findOne({ shortId: shortId });
        if (user) {
            res.json({ name: user.name });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});