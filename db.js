const mongoose = require('mongoose');
const Product = require('./models/Product');

// Your connection URI remains the same
const mongoURI = process.env.MONGO_URI;
// const mongoURI = "mongodb://127.0.0.1:27017/inotebook?directConnection=true&appName=mongosh+1.8.0"
// const mongoURI = "mongodb+srv://Samit Shrestha:shrestha101@vibecouture.ajyyolz.mongodb.net/?appName=VibeCouture"
// Updated options object without deprecated options    
// const mongoURI = "mongodb+srv://shresthasamit40:shrestha101@vibecouture.ajyyolz.mongodb.net/?appName=VibeCouture"

const connectToMongo = async () => {
    try {
        // --- CHANGE IS HERE: Remove the options object ---
        await mongoose.connect(mongoURI);

        console.log("connected to mongo successfully");
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        // It's good practice to exit the process if the DB connection fails
        process.exit(1);
    }
}

module.exports = connectToMongo;