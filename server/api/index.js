// Vercel Serverless Function entry.
// Express apps are (req, res) handlers, so exporting the app works.

const app = require("../src/app");

module.exports = app;
