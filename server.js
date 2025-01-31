require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const shortid = require('shortid');
const mailjet = require('node-mailjet').connect(process.env.MAILJET_API_KEY, process.env.MAILJET_SECRET_KEY);

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    shortId: String,
    date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

app.post('/api/submit-name', async(req, res) => {
    try {
        const { name, email } = req.body;
        const shortId = shortid.generate();
        const newUser = new User({ name, email, shortId });
        await newUser.save();

        // Send email notification to the first user
        const firstUser = await User.findOne({}, {}, { sort: { 'date': 1 } });
        if (firstUser) {
            const request = mailjet.post("send", { 'version': 'v3.1' }).request({
                "Messages": [{
                    "From": {
                        "Email": process.env.EMAIL,
                        "Name": "Your Name"
                    },
                    "To": [{
                        "Email": firstUser.email,
                        "Name": firstUser.name
                    }],
                    "Subject": "New User Notification",
                    "TextPart": `Hello ${firstUser.name}, a new user named ${name} has joined.`,
                    "HTMLPart": `<h3>Hello ${firstUser.name},</h3><p>A new user named ${name} has joined.</p>`
                }]
            });
            await request;
        }

        res.status(200).json({ shortId });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/api/submit-response', async(req, res) => {
    try {
        const { shortId, response } = req.body;
        const user = await User.findOne({ shortId: shortId });
        if (user) {
            const request = mailjet.post("send", { 'version': 'v3.1' }).request({
                "Messages": [{
                    "From": {
                        "Email": process.env.EMAIL,
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
            res.status(200).send('Response sent');
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;