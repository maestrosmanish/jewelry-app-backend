import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config();

const URL = process.env.URL;
 const dataBase = mongoose.connect(URL).then(()=>console.log('DB connected')).catch(err=>console.log(err));

 export default dataBase;