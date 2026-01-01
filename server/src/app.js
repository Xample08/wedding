require("dotenv").config();

const express = require("express");

const superadminRoutes = require("./routes/superadmin.routes");
const guestRoutes = require("./routes/guest.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

// If you deploy behind a proxy/load balancer, enable this
// app.set("trust proxy", true);

app.use(express.json({ limit: "64kb" }));

app.get("/health", (req, res) => {
    res.json({ ok: true });
});

app.use("/superadmin", superadminRoutes);
app.use("/guest", guestRoutes);
app.use("/admin", adminRoutes);

// 404
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    const status = Number(err.status) || 500;
    const message = status >= 500 ? "Internal server error" : err.message;

    if (process.env.NODE_ENV !== "production") {
        // Log full error in dev
        // eslint-disable-next-line no-console
        console.error(err);
    }

    res.status(status).json({ error: message });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`RSVP API listening on http://localhost:${port}`);
});
