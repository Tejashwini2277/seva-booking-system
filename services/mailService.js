import express from "express";
import pool from "../db.js";

const router = express.Router();

// GET all bookings (clean date format)
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM bookings ORDER BY pooja_date ASC");

        const formatted = rows.map(item => ({
            ...item,
            pooja_date: item.pooja_date.toISOString().split("T")[0] // return YYYY-MM-DD
        }));

        res.json(formatted);
    } catch (err) {
        console.error("❌ Fetch Error:", err);
        res.status(500).json({ message: "Failed to load bookings" });
    }
});

// ADD new booking (EXACT 3-day rule + prevent duplicate)
router.post("/add", async (req, res) => {
    try {
        const { sevakartha_name, department, seva_type, pooja_date } = req.body;

        const cleanDate = pooja_date.trim();
        const poojaDateObj = new Date(cleanDate);

        // Normalize today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Required booking date = EXACTLY 3 days earlier
        const requiredBookingDate = new Date(poojaDateObj);
        requiredBookingDate.setDate(poojaDateObj.getDate() - 3);
        requiredBookingDate.setHours(0, 0, 0, 0);

        // Check exact match
        if (today.getTime() !== requiredBookingDate.getTime()) {
            return res.status(400).json({
                error: "❌ Booking is ONLY allowed exactly 3 days before the Pooja date"
            });
        }

        // Prevent booking duplicate day
        const [existing] = await pool.query(
            "SELECT id FROM bookings WHERE pooja_date = ? AND status = 'booked'",
            [cleanDate]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                error: "❌ This date is already booked and unavailable!"
            });
        }

        // Date parts
        const day = poojaDateObj.getDate();
        const month = poojaDateObj.getMonth() + 1;
        const year = poojaDateObj.getFullYear();

        // Insert booking
        await pool.query(
            "INSERT INTO bookings (sevakartha_name, department, seva_type, pooja_date, day, month, year, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'booked')",
            [sevakartha_name, department, seva_type, cleanDate, day, month, year]
        );

        res.json({ message: "🎉 Booking saved successfully!" });

    } catch (err) {
        console.error("❌ Save error:", err);
        res.status(500).json({ error: "Failed to save booking" });
    }
});

// DELETE booking
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query("DELETE FROM bookings WHERE id = ?", [id]);
        res.json({ message: "Booking deleted successfully" });
    } catch (err) {
        console.error("❌ Delete Error:", err);
        res.status(500).json({ message: "Failed to delete booking" });
    }
});

export default router;
