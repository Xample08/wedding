# Multi-Step RSVP Form

## Overview

The RSVP system has been implemented as a **4-step progressive form** with a visual progress indicator. Guests can submit their response and edit it later if needed.

## User Flow

1. **Invitation Experience** (`/invite/[token]`)

    - After viewing the invitation, guests can click "RSVP Now" on the RSVP section
    - If they've already responded, the button shows "Edit RSVP"

2. **RSVP Form** (`/rsvp/[token]`)

    - Progressive form with numbered step indicators
    - Step 1: **Name** - Editable name (updates `display_name`)
    - Step 2: **Attendance** - Fancy toggle: "Excited to attend" or "Unable to attend"
    - Step 3: **Wishes** - Text area for wedding wishes
    - Step 4: **Teapai** (only if `is_family === true`) - Morning (pagi) or Evening (malam)
    - Each step has "Previous" and "Next" buttons
    - Last step shows "Submit" instead of "Next"

3. **Submission**
    - Records IP address and User-Agent to prevent spam
    - Success screen with confirmation message
    - Auto-redirects back to invitation after 2 seconds

## Features

### Visual Progress

-   Numbered circles (1, 2, 3, 4) connected by a progress line
-   Active and completed steps highlighted in brown (#8B4513)
-   Smooth transitions and animations

### Form Validation

-   Step 2 requires attendance selection before proceeding
-   Name field from database is pre-filled
-   Teapai step only appears for family members

### Edit Mode

-   Users can edit their RSVP after initial submission
-   When wishes are edited, `show_wishes` is automatically set to `false` (hidden from public view until reviewed)
-   All other fields remain editable without restrictions

### Spam Prevention

-   IP address and User-Agent tracked on submission
-   Can be extended with rate limiting or duplicate detection

## Files Created/Modified

### New Files

-   `src/app/components/RsvpForm.tsx` - Multi-step form component
-   `src/app/rsvp/[token]/page.tsx` - RSVP page with loading and success states

### Modified Files

-   `src/services/invitationsService.ts`:
    -   Added `updateGuestRsvp()` function for editing responses
    -   Detects wishes changes and sets `show_wishes = false`
-   `src/controllers/guestController.ts`:
    -   Updated to handle both new submissions and updates
    -   Changed field names to camelCase (`isAttending`, `displayName`)
-   `src/app/invite/InviteExperience.tsx`:
    -   Replaced inline RSVP form with link button
    -   Simplified to show "RSVP Now" or "Edit RSVP"

## Database Updates

The system updates the following fields:

-   `display_name` - Guest's preferred display name
-   `is_attending` - Boolean (true = excited, false = unable)
-   `wishes` - Text message
-   `teapai` - "pagi" or "malam" (family only)
-   `submitted_ip` - IP address for spam tracking
-   `user_agent` - Browser/device info
-   `show_wishes` - Set to false when wishes are edited
-   `responded_at` - Timestamp of first submission (not updated on edits)
-   `updated_at` - Timestamp of last update

## Styling

-   Uses existing color scheme: brown (#8B4513) for primary actions
-   Inter font for UI elements
-   Ovo font for headings
-   Smooth transitions and hover effects
-   Mobile-optimized with responsive padding

## API Endpoints

### GET `/api/guest/invitations/[token]`

Fetches invitation details including current RSVP status

### PATCH `/api/guest/invitations/[token]`

Submits or updates RSVP with:

```json
{
  "displayName": "string",
  "isAttending": boolean,
  "wishes": "string",
  "teapai": "pagi" | "malam" | null
}
```

Response includes IP and User-Agent automatically from request headers.
