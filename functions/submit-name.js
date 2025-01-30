const mongoose = require('mongoose');
const shortid = require('shortid');
const mailjet = require('node-mailjet').apiConnect(process.env.MAILJET_API_KEY, process.env.MAILJET_SECRET_KEY);

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    shortId: String,
    date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed',
        };
    }

    try {
        const { name, email } = JSON.parse(event.body);
        const shortId = shortid.generate();
        const newUser = new User({ name, email, shortId });
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
                    "TextPart": `Hello ${firstUser.name}, a new user named ${name} has joined.`,
                    "HTMLPart": `<h3>Hello ${firstUser.name},</h3><p>A new user named ${name} has joined.</p>`
                }]
            });
            await request;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ shortId }),
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: 'Internal Server Error',
        };
    }
};