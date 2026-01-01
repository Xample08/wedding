const express = require("express");
const { requireSuperAdmin } = require("../middlewares/auth");
const { asyncHandler } = require("../utils/http");
const {
    createInvitationHandler,
    softDeleteHandler,
} = require("../controllers/superadmin.controller");

const router = express.Router();

router.post(
    "/invitations",
    requireSuperAdmin,
    asyncHandler(createInvitationHandler)
);

router.delete(
    "/invitations/:token",
    requireSuperAdmin,
    asyncHandler(softDeleteHandler)
);

module.exports = router;
