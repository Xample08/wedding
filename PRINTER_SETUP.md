# Zebra GT820 Printer Setup

This document explains how to configure and use the Zebra GT820 printer for printing guest labels via USB connection.

## Prerequisites

- Zebra GT820 printer connected via USB
- Printer installed and configured in your operating system
- `node-zpl` package installed (included in dependencies)

## Configuration

Copy `.env.local.example` to `.env.local` and configure:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your printer settings:

### USB Printing Configuration

```env
PRINTER_NAME=ZDesigner GT820
```

**Finding Your Printer Name:**

- **Windows**: 
  1. Open Control Panel → Devices and Printers
  2. Find your Zebra printer and copy the exact name
  3. Use that exact name in the configuration

- **macOS**: 
  1. Open System Preferences → Printers & Scanners
  2. Select your Zebra printer and copy the name
  3. Use that exact name in the configuration

- **Linux**: 
  1. Run `lpstat -p -d` to list all printers
  2. Find your Zebra printer in the list
  3. Use the printer name shown in the configuration

## API Usage

### Print a Guest Label

**Endpoint:** `POST /api/admin/print/[token]`

**Authentication:** Requires admin authentication

**Example:**

```bash
curl -X POST http://localhost:3000/api/admin/print/ABC123 \
  -H "Cookie: admin_session=your_session_token"
```

### Test Printer (Without Real Guest Data)

**Endpoint:** `GET /api/admin/print/test?isPrint=true`

**Authentication:** Requires admin authentication

**Example:**

```bash
# Preview test data without printing
curl http://localhost:3000/api/admin/print/test

# Actually send test label to printer
curl "http://localhost:3000/api/admin/print/test?isPrint=true"
```

**Response:**

```json
{
  "success": true,
  "message": "Test label sent to printer",
  "data": {
    "token": "TEST-1234567890",
    "name": "Test Guest",
    "displayName": "Test Guest",
    "actualAttendance": 2,
    "gaveGift": true
  },
  "printed": true
}
```

## Label Layout

The printed label includes:
- Guest name (display name or full name)
- Token number (in text and barcode format)
- Attendance count
- Gift status (Yes/No)
- Code 128 barcode for scanning

## Installation

After configuring the environment variables, install the dependencies:

```bash
npm install
```

The `node-zpl` package provides a fluent API for generating ZPL (Zebra Programming Language) code. The ZPL is then sent to the printer using your operating system's print system:

- **Windows**: PowerShell `Out-Printer` cmdlet
- **macOS/Linux**: Can be adapted to use `lp` or `lpr` commands (currently Windows-only)

## How It Works

1. **ZPL Generation**: The `Label` class from `node-zpl` builds ZPL code using a fluent API
2. **Temporary File**: ZPL code is written to a temporary file
3. **Print Command**: PowerShell sends the file content to the USB printer via `Out-Printer`
4. **Cleanup**: Temporary file is automatically deleted

## Troubleshooting

### Printer Not Found

- Verify the printer name exactly matches the OS printer name (case-sensitive)
- Ensure the printer is powered on and connected via USB
- Check printer is not in use by another application
- On Linux, ensure your user has permission to access the printer
- Run `lpstat -a` (Linux/Mac) or check Devices and Printers (Windows)

### Permission Errors (Linux/macOS)

If you get permission denied errors:
```bash
# Add your user to the lp group (Linux)
sudo usermod -a -G lp $USER

# Or run with appropriate permissions
sudo chmod 666 /dev/usb/lp0
```

### Print Quality Issues

- Clean the printer head
- Check label stock is loaded correctly
- Adjust darkness settings in ZPL template if needed

You can test the printer connection by:
1. Navigating to `/superadmin/print/test` in your browser
2. Click "Preview Data" to see what will be printed
3. Click "🖨️ Send Test Print" to send a test label to the printer

## ZPL Template Customization

The label is built in `src/utils/printer.ts` using the `node-zpl` `Label` class and its fluent API.

**Example:**
```typescript
const label = new Label(4, 3, 203); // 4" x 3" at 203 DPI

label
    .drawText({ text: "Wedding Guest", x: 50, y: 80, fontSize: 50 })
    .drawText({ text: guestName, x: 50, y: 150, fontSize: 40 })
    .drawCode128({ data: token, x: 400, y: 490, height: 120 })
    .close();

const zplCode = label.dumpZPL(); // Generate ZPL string
```

Key methods available:
- `.drawText({ text, x, y, fontSize })` - Add text fields
- `.drawCode128({ data, x, y, height })` - Add Code 128 barcode
- `.drawBox(x, y, width, height)` - Draw rectangles
- `.drawLine(x1, y1, x2, y2)` - Draw lines
- `.close()` - Finalize the label
- `.dumpZPL()` - Export as ZPL string

To modify the label layout:
1. Edit the `generateZPL()` function in `src/utils/printer.ts`
2. Adjust coordinates, font sizes, and barcode properties
3. The label dimensions are 4" x 3" at 203 DPI (Zebra GT820 default)

## Testing Without Physical Printer

For development/testing without a physical printer, the code will log print jobs to the console but fail to send actual print commands. Consider using:

- Zebra Setup Utilities (Windows) with virtual printer
- ZPL viewer tools online (labelary.com)
