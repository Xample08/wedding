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
        // Transform data to match Python Pydantic model
        const printerData = {
            code: data.token,
            name: data.displayName || data.name,
            side: data.side,
            rsvp: data.rsvp,
            actual: data.actualAttendance,
            table: data.tableNumber,
        };

        const response = await fetch(
            process.env.PRINTER_API_URL || "http://localhost:4000/print",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(printerData),
            },
        );
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Printer API error: ${response.status} ${response.statusText} - ${errorText}`,
            );
        }
        console.log("Label sent to printer successfully");
    } catch (err) {
        console.error("Failed to send label to printer:", err);
        throw err; // Re-throw to be handled by caller
    }
}
