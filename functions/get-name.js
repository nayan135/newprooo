const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    shortId: String,
    date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

exports.handler = async(event, context) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed',
        };
    }

    try {
        const shortId = event.queryStringParameters.shortId;
        const user = await User.findOne({ shortId: shortId });
        if (user) {
            return {
                statusCode: 200,
                body: JSON.stringify({ name: user.name }),
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