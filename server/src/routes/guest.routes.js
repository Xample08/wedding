const express = require("express");
const { asyncHandler } = require("../utils/http");
const {
    getInvitationByToken,
    submitRsvp,
} = require("../controllers/guest.controller");

const router = express.Router();

router.get("/invitations/:token", asyncHandler(getInvitationByToken));
router.post("/invitations/:token/rsvp", asyncHandler(submitRsvp));

module.exports = router;
