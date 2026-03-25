import { Router } from "express";

const router = Router();

router.route("/").get((req, res) => {
    res.status(200).json({
        status: "ok",
        message: "success"
    })
});

export default router;