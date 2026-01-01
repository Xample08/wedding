const express = require("express");
const { requireAdmin } = require("../middlewares/auth");
const { asyncHandler } = require("../utils/http");
const {
    updateInvitation,
    getSummary,
    listInvitations,
} = require("../controllers/admin.controller");

const router = express.Router();

router.get("/summary", requireAdmin, asyncHandler(getSummary));
router.get("/invitations", requireAdmin, asyncHandler(listInvitations));
router.patch(
    "/invitations/:token",
    requireAdmin,
    asyncHandler(updateInvitation)
);

module.exports = router;
