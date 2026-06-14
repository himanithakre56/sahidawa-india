import { type VerifyResult } from "@/lib/api";

export type LocalScanHistorySource = "barcode" | "manual" | "ocr";

export interface LocalScanHistoryEntry {
    id: string;
    scannedAt: number; // timestamp in ms
    medicineName: string;
    source: LocalScanHistorySource;
    result: VerifyResult | null;
    errorMessage?: string;
    status: "VERIFIED" | "FAKE" | "SUSPICIOUS";
}

export interface BuildLocalScanHistoryEntryOptions {
    id?: string;
    scannedAt?: number;
    result: VerifyResult;
    source: LocalScanHistorySource;
    errorMessage?: string;
}

// Storage key for IndexedDB
const DB_NAME = "SahiDawa";
const STORE_NAME = "scanHistory";
const DB_VERSION = 1;

/**
 * Initialize IndexedDB for scan history storage
 */
function getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
                store.createIndex("scannedAt", "scannedAt", { unique: false });
            }
        };
    });
}

/**
 * Save a scan history entry to IndexedDB
 */
export async function saveLocalScanHistoryEntry(entry: LocalScanHistoryEntry): Promise<string> {
    try {
        const db = await getDB();
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        store.put(entry);

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve(entry.id);
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error("Failed to save scan history:", error);
        // Fallback to localStorage
        try {
            const existing = localStorage.getItem("sahidawa_scan_history") || "[]";
            const history = JSON.parse(existing) as LocalScanHistoryEntry[];
            history.push(entry);
            localStorage.setItem("sahidawa_scan_history", JSON.stringify(history.slice(-100))); // Keep last 100
            return entry.id;
        } catch (e) {
            console.error("Fallback localStorage also failed:", e);
            throw error;
        }
    }
}

/**
 * Retrieve all cached scan history entries
 */
export async function getLocalScanHistoryEntries(): Promise<LocalScanHistoryEntry[]> {
    try {
        const db = await getDB();
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result as LocalScanHistoryEntry[]);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Failed to retrieve scan history from IndexedDB:", error);
        // Fallback to localStorage
        try {
            const existing = localStorage.getItem("sahidawa_scan_history") || "[]";
            return JSON.parse(existing) as LocalScanHistoryEntry[];
        } catch (e) {
            console.error("Fallback localStorage also failed:", e);
            return [];
        }
    }
}

/**
 * Clear all cached scan history
 */
export async function clearLocalScanHistory(): Promise<void> {
    try {
        const db = await getDB();
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        store.clear();

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error("Failed to clear scan history:", error);
        // Fallback to localStorage
        localStorage.removeItem("sahidawa_scan_history");
    }
}

/**
 * Build a local scan history entry from API result
 */
export function buildLocalScanHistoryEntry(
    options: BuildLocalScanHistoryEntryOptions
): LocalScanHistoryEntry {
    const id = options.id || crypto.randomUUID();
    const scannedAt = options.scannedAt || Date.now();
    const status = getStatusFromResult(options.result);

    const medicineName =
        options.result.verified && options.result.medicine
            ? options.result.medicine.brand_name || "Unknown"
            : options.errorMessage || "Unknown medicine";

    return {
        id,
        scannedAt,
        medicineName,
        source: options.source,
        result: options.result,
        errorMessage: options.errorMessage,
        status,
    };
}

/**
 * Extract status from verification result
 */
function getStatusFromResult(result: VerifyResult): "VERIFIED" | "FAKE" | "SUSPICIOUS" {
    if (!result.verified) {
        return "SUSPICIOUS";
    }

    if (result.medicine?.is_counterfeit_alert) {
        return "FAKE";
    }

    return "VERIFIED";
}

/**
 * Get recent scans (last N entries)
 */
export async function getRecentScans(limit: number = 10): Promise<LocalScanHistoryEntry[]> {
    const all = await getLocalScanHistoryEntries();
    return all.sort((a, b) => b.scannedAt - a.scannedAt).slice(0, limit);
}

/**
 * Search scan history by medicine name
 */
export async function searchScanHistory(query: string): Promise<LocalScanHistoryEntry[]> {
    const all = await getLocalScanHistoryEntries();
    const lowerQuery = query.toLowerCase();
    return all.filter((entry) => entry.medicineName.toLowerCase().includes(lowerQuery));
}
