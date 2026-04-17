import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import dietRouter from "./diet";
import workoutRouter from "./workout";
import foodRouter from "./food";
import trackingRouter from "./tracking";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(dietRouter);
router.use(workoutRouter);
router.use(foodRouter);
router.use(trackingRouter);
router.use(dashboardRouter);

export default router;
