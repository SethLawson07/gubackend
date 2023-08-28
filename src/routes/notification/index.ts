import { Router } from "express"
import { sendNotification, sendToTopic } from "../../services/Notification";
import { Auth, UserIsAdmin } from "../../utils/middlewares";

const router = Router();

router.route("/send").post(sendNotification);
router.route("/sendtopic").post(Auth, UserIsAdmin, sendToTopic);

export default router;