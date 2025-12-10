import cron from "node-cron";
import pool from "./db.js";
import { sendReminderEmail } from "./services/mailService.js";

// Run everyday at 7 AM India time
cron.schedule("0 7 * * *", async () => {
    console.log("🔔 Running daily pooja reminder check...");

    try {
        // get tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
        const dd = String(tomorrow.getDate()).padStart(2, "0");
        const formatted = `${yyyy}-${mm}-${dd}`;

        const [rows] = await pool.query(
            "SELECT * FROM bookings WHERE pooja_date = ? AND status = 'booked'",
            [formatted]
        );

        if (rows.length > 0) {
            console.log(`📨 Sending reminders for ${rows.length} bookings...`);
            for (const booking of rows) {
                await sendReminderEmail(booking);
            }
        } else {
            console.log("ℹ No pooja scheduled for tomorrow.");
        }

    } catch (err) {
        console.error("❌ Cron error:", err);
    }
}, {
    timezone: "Asia/Kolkata"
});
