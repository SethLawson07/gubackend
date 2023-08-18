import { Router } from "express"
import { Auth } from "../../utils/middlewares"
import { sendNotification } from "../../services/Notification";

const router = Router();

router.route("/send").post(sendNotification);

export default router;