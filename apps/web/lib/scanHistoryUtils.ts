import { VerifyResult } from "@/lib/api";
import { saveScanHistory } from "@/lib/db/scanHistory";

export function getScanHistoryStatus(result: VerifyResult): string {
    if (!result.verified) return "SUSPICIOUS";
    return result.medicine.is_counterfeit_alert ? "FAKE" : "VERIFIED";
}

export function getScanHistoryMedicineName(
    result: VerifyResult,
    fallbackBrandName?: string
): string {
    if (result.verified) {
        return result.medicine.brand_name || fallbackBrandName || "Unknown medicine";
    }
    return fallbackBrandName || "Unknown medicine";
}

export async function recordScanHistory(result: VerifyResult, fallbackBrandName?: string) {
    await saveScanHistory({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        medicineName: getScanHistoryMedicineName(result, fallbackBrandName),
        status: getScanHistoryStatus(result),

        manufacturer: result.verified ? result.medicine.manufacturer : undefined,

        genericName: result.verified ? result.medicine.generic_name : undefined,

        batchNumber: result.verified ? result.medicine.batch_number : undefined,

        expiryDate: result.verified ? result.medicine.expiry_date : undefined,

        counterfeit: result.verified ? result.medicine.is_counterfeit_alert : undefined,
    });
}
