require("dotenv").config();

const app = require("./app");

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`RSVP API listening on http://localhost:${port}`);
});
