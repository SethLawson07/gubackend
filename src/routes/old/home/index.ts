import { Router } from "express"
import { clientHome1, clientHome2 } from "../../../services/old/Home";

const router = Router();

router.route("/clientweb1").get(clientHome1);
router.route("/clientweb2").get(clientHome2);

export default router;
