import express from "express";
import chatBotController from "../controllers/chatBotController"
let router = express.Router();

let initWebRoutes = (app) => {
    router.get("/", chatBotController.getHomePage);

    router.get("/webhook", chatBotController.getWebhook);

    router.post("/webhook", chatBotController.postWebhook);

    return app.use("/", router);
};

module.exports = initWebRoutes;