import express from "express";
import cors from "cors";
import bookingRoutes from "./routes/bookingRoutes.js";

// 🔔 Import cron job so it starts automatically
import "./cronJob.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/oms/details", bookingRoutes);

app.listen(process.env.PORT || 5000, () => {
    console.log("Server running on port " + (process.env.PORT || 8000));
});
