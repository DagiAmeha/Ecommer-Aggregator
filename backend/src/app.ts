import cors from "cors";
import express from "express";
import { authRouter } from "./modules/auth/auth.route";
import { aggregationRouter } from "./modules/aggregation/aggregation.route";
import { userRouter } from "./modules/user/user.route";
import { productRouter } from "./modules/product/product.route";
import { storeRouter } from "./modules/store/store.route";
import { vendorRouter } from "./modules/vendor/vendor.route";
import { reviewRouter } from "./modules/reviews/review.route";
import { wishlistRouter } from "./modules/wishlist/wishlist.route";
import { notFoundMiddleware } from "./middleware/notfound.middleware";
import { errorMiddleware } from "./middleware/error.middleware";
import { sendSuccess } from "./utils/api-response";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  sendSuccess(res, { status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/aggregation", aggregationRouter);
app.use("/api/stores", storeRouter);
app.use("/api/vendor", vendorRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/wishlist", wishlistRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
