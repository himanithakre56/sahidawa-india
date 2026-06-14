export interface ScanHistoryRecord {
    id: string;
    timestamp: number;
    medicineName: string;
    status: "VERIFIED" | "FAKE" | "SUSPICIOUS";
}

export async function saveScanHistory(record: ScanHistoryRecord): Promise<void> {
    try {
        const response = await fetch("/api/v1/scan/history", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: record.id,
                timestamp: record.timestamp,
                medicineName: record.medicineName,
                status: record.status,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error("Failed to save scan history to database:", error);
        }
    } catch (error) {
        // Network error or backend unavailable
        // Local cache will keep the data
        console.warn("Could not reach backend to save scan history:", error);
    }
}

//Fetch user's scan history from backend

export async function getScanHistory(): Promise<ScanHistoryRecord[]> {
    try {
        const response = await fetch("/api/v1/scan/history", {
            method: "GET",
        });

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return data.records || [];
    } catch (error) {
        console.warn("Could not fetch scan history from backend:", error);
        return [];
    }
}

export async function getScanHistoryFromBackend(): Promise<ScanHistoryRecord[]> {
    return getScanHistory();
}

export async function deleteScanHistory(id: string): Promise<void> {
    try {
        const response = await fetch(`/api/v1/scan/history/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error("Failed to delete scan history:", error);
        }
    } catch (error) {
        console.warn("Could not delete scan history from backend:", error);
    }
}

export async function clearAllScanHistory(): Promise<void> {
    try {
        const response = await fetch("/api/v1/scan/history", {
            method: "DELETE",
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error("Failed to clear scan history:", error);
        }
    } catch (error) {
        console.warn("Could not clear scan history from backend:", error);
    }
}
