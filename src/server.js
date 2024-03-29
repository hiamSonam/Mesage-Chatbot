import express from "express";
import viewEngine from "./config/viewEngine";
import initWebRoutes from "./routes/web"; 
import bodyParser from "body-parser";
require("dotenv").config();

let app = express();

viewEngine(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

initWebRoutes(app);

let port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log("Chatbot is runing at ", port);
})