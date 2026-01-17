const mongoose = require('mongoose');
const Product = require('./models/Product');
const mongoURI = "mongodb://127.0.0.1:27017/inotebook?directConnection=true&appName=mongosh+1.8.0";

const connectToMongo = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log("Connected to Mongo");
        const count = await Product.countDocuments();
        console.log(`Product count: ${count}`);
        if (count > 0) {
            const products = await Product.find({}, 'name price');
            console.log("Sample products:", products);
        } else {
            console.log("No products found in DB.");
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
connectToMongo();
