import express from "express"
import mongoose from "mongoose";
import dotenv from 'dotenv'
import cors  from 'cors' 
import dataBase from "./src/config/db.js";
import CategoryRoute from "./routes/categoryRoute.js";
import ProductRoute from "./routes/productRoute.js";
import cartRoute from "./routes/cartitemsRoute.js";
import orderRoute from "./routes/ordersRoute.js";
import userRoute from "./routes/userRoute.js";
import Wishlist from "./models/Wishlist.js";
import wishlistRoute from "./routes/wishlistRoute.js";
import statusRouter from "./routes/statsRoutes.js";


dotenv.config();
const app = express();
app.use(express.json());
app.use(cors("*"));
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT; 
app.use('/api',userRoute);
app.use('/api',orderRoute);
app.use('/api',cartRoute);
app.use('/api',ProductRoute);
app.use("/api",CategoryRoute);
app.use('/api',wishlistRoute);
app.use('/api',statusRouter);
app.get('/',(req,res)=>{
    res.status(200).send('Api tested !!');
}) 

app.listen(PORT,()=>{
    console.log(`server run on Port ${PORT}`);
})
