export async function sendToPrinter(data: {
    token: string;
    name: string;
    displayName: string;
    side: string;
    rsvp: number;
    actualAttendance: number;
    tableNumber: string;
}) {
    try {
        console.log("[printer] sendToPrinter called", {
            token: data.token,
            name: data.name,
            displayName: data.displayName,
            side: data.side,
            rsvp: data.rsvp,
            actualAttendance: data.actualAttendance,
            tableNumber: data.tableNumber,
        });

        // Transform data to match Python Pydantic model
        const printerData = {
            code: data.token,
            name: data.displayName || data.name,
            side: data.side,
            rsvp: data.rsvp,
            actual: data.actualAttendance,
            table: data.tableNumber,
        };

        const printerApiUrl =
            process.env.PRINTER_API_URL || "http://localhost:4000/barcode";

        console.log("[printer] sending request", {
            url: printerApiUrl,
            payload: printerData,
        });

        const response = await fetch(printerApiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(printerData),
        });

        console.log("[printer] response received", {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[printer] api error response", {
                status: response.status,
                statusText: response.statusText,
                errorText,
            });
            throw new Error(
                `Printer API error: ${response.status} ${response.statusText} - ${errorText}`,
            );
        }

        console.log("[printer] label sent to printer successfully");
    } catch (err) {
        console.error("[printer] failed to send label to printer:", err);
        throw err; // Re-throw to be handled by caller
    }
}
