import "server-only";

/**
 * Check if an error is a database connection error that should be retried
 */
function isRetriableDbError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;

    const err = error as any;
    const code = err.code || err.errno;
    const message = String(err.message || "").toLowerCase();

    // MySQL/MariaDB connection error codes
    const retriableCodes = [
        "ECONNRESET",
        "ECONNREFUSED",
        "ETIMEDOUT",
        "PROTOCOL_CONNECTION_LOST",
        "ER_GET_CONNECTION_TIMEOUT",
        "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR",
    ];

    if (code && retriableCodes.includes(code)) return true;

    // Check message for connection-related keywords
    const retriableMessages = [
        "connection",
        "connect",
        "timeout",
        "reset",
        "lost",
        "closed",
        "econnreset",
    ];

    return retriableMessages.some((keyword) => message.includes(keyword));
}

/**
 * Retry a database operation with exponential backoff
 * @param operation The async function to retry
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @param initialDelayMs Initial delay in milliseconds (default: 100)
 * @returns The result of the operation
 */
export async function retryDbOperation<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    initialDelayMs = 100
): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            // If it's not a retriable error or we're out of retries, throw immediately
            if (!isRetriableDbError(error) || attempt === maxRetries) {
                throw error;
            }

            // Calculate exponential backoff delay
            const delay = initialDelayMs * Math.pow(2, attempt);
            const jitter = Math.random() * delay * 0.1; // Add 10% jitter

            // Log retry attempt (in production, use proper logger)
            console.warn(
                `DB connection error, retrying (${
                    attempt + 1
                }/${maxRetries}) after ${Math.round(delay + jitter)}ms`,
                error
            );

            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, delay + jitter));
        }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError;
}
