require('dotenv').config();
const mongoose = require('mongoose');
const mailjet = require('node-mailjet').connect(process.env.MAILJET_API_KEY, process.env.MAILJET_SECRET_KEY);

const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;

const connectToDatabase = async () => {
    if (isConnected) {
        return;
    }
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    isConnected = true;
};

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    shortId: String,
    date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed',
        };
    }

    try {
        await connectToDatabase();

        const { shortId, response } = JSON.parse(event.body);
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
            return {
                statusCode: 200,
                body: 'Response sent',
            };
        } else {
            return {
                statusCode: 404,
                body: 'User not found',
            };
        }
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: 'Internal Server Error',
        };
    }
};