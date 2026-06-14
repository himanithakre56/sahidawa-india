"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { getLocalScanHistoryEntries, type LocalScanHistoryEntry } from "@/lib/localScanHistory";
import {
    WifiOff,
    Home,
    RefreshCw,
    Wifi,
    Pill,
    MapPin,
    ShieldCheck,
    PartyPopper,
    Check,
    AlertTriangle,
    XCircle,
    ChevronRight,
} from "lucide-react";

/**
 * OfflinePage — Premium offline fallback UI for SahiDawa.
 * Automatically redirects to home when the connection is restored.
 */
export default function OfflinePage() {
    const t = useTranslations("offline");
    const [isRetrying, setIsRetrying] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [showReconnected, setShowReconnected] = useState(false);
    const [history, setHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [selectedScan, setSelectedScan] = useState<LocalScanHistoryEntry | null>(null);

    // Load cached scan history on mount
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const entries = await getLocalScanHistoryEntries();
                setHistory(entries.sort((a, b) => b.scannedAt - a.scannedAt)); // Most recent first
            } catch (error) {
                console.error("Failed to load scan history:", error);
                setHistory([]);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        loadHistory();
    }, []);

    // Sync initial state from navigator.onLine after mount
    useEffect(() => {
        const handleOnline = () => {
            setShowReconnected(true);
            // Auto-redirect after a short confirmation delay
            setTimeout(() => {
                window.location.href = "/";
            }, 1800);
        };

        const handleOffline = () => {
            setShowReconnected(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const handleRetry = useCallback(() => {
        setIsRetrying(true);
        setRetryCount((c) => c + 1);

        // Give the browser time to attempt a real network check
        setTimeout(() => {
            if (navigator.onLine) {
                window.location.reload();
            } else {
                setIsRetrying(false);
            }
        }, 1500);
    }, []);

    // Format timestamp for display
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();

        if (isToday) {
            return date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
            });
        }

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    // Get status badge styling
    const getStatusBadgeStyle = (
        status: "VERIFIED" | "FAKE" | "SUSPICIOUS"
    ): { bg: string; text: string; icon: typeof Check } => {
        switch (status) {
            case "VERIFIED":
                return {
                    bg: "bg-emerald-500/20 border-emerald-500/30",
                    text: "text-emerald-400",
                    icon: Check,
                };
            case "FAKE":
                return {
                    bg: "bg-red-500/20 border-red-500/30",
                    text: "text-red-400",
                    icon: AlertTriangle,
                };
            case "SUSPICIOUS":
                return {
                    bg: "bg-amber-500/20 border-amber-500/30",
                    text: "text-amber-400",
                    icon: XCircle,
                };
        }
    };

    // ─── Reconnected state ───────────────────────────────────────────────────
    if (showReconnected) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6">
                <div className="animate-fadeIn max-w-md text-center">
                    {/* Animated checkmark ring */}
                    <div className="relative mx-auto mb-8 h-28 w-28">
                        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
                        <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-2xl shadow-emerald-500/40">
                            <Wifi size={52} className="text-white" />
                        </div>
                    </div>

                    <h1 className="mb-3 flex items-center justify-center gap-2 text-3xl font-bold text-white">
                        {t("bannerOnline")} <PartyPopper className="h-8 w-8 text-emerald-400" />
                    </h1>
                    <p className="mb-2 text-lg text-emerald-400">{t("descriptionOnline")}</p>
                    <p className="text-sm text-slate-400">{t("redirecting")}</p>

                    {/* Progress bar */}
                    <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                        <div className="animate-progress h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
                    </div>
                </div>
            </main>
        );
    }

    // ─── Detail modal for selected scan ──────────────────────────────────────
    if (selectedScan && selectedScan.result?.verified && selectedScan.result.medicine) {
        const med = selectedScan.result.medicine;
        const statusStyle = getStatusBadgeStyle(selectedScan.status);
        const StatusIcon = statusStyle.icon;

        return (
            <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
                <div className="relative w-full max-w-lg">
                    <button
                        onClick={() => setSelectedScan(null)}
                        className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-700/80"
                    >
                        ← Back to Offline
                    </button>

                    <div className={`rounded-2xl border ${statusStyle.bg} p-6`}>
                        {/* Header */}
                        <div className="mb-6 flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white">{med.brand_name}</h2>
                                <p className="text-sm text-slate-400">
                                    Scanned {formatTime(selectedScan.scannedAt)}
                                </p>
                            </div>
                            <div
                                className={`flex h-12 w-12 items-center justify-center rounded-full ${statusStyle.bg}`}
                            >
                                <StatusIcon size={20} className={statusStyle.text} />
                            </div>
                        </div>

                        {/* Status badge */}
                        <div
                            className={`mb-6 inline-block rounded-full border ${statusStyle.bg} px-3 py-1 text-sm font-semibold ${statusStyle.text}`}
                        >
                            {selectedScan.status}
                        </div>

                        {/* Medicine details grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
                                <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                    Generic Name
                                </p>
                                <p className="mt-1 font-medium text-slate-200">
                                    {med.generic_name}
                                </p>
                            </div>

                            <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
                                <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                    Manufacturer
                                </p>
                                <p className="mt-1 font-medium text-slate-200">
                                    {med.manufacturer}
                                </p>
                            </div>

                            <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
                                <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                    Batch Number
                                </p>
                                <p className="mt-1 font-mono font-bold text-slate-200">
                                    {med.batch_number}
                                </p>
                            </div>

                            <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
                                <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                    Expiry
                                </p>
                                <p className="mt-1 font-medium text-slate-200">
                                    {med.expiry_date
                                        ? new Date(med.expiry_date).toLocaleDateString("en-US", {
                                              month: "short",
                                              year: "numeric",
                                          })
                                        : "N/A"}
                                </p>
                            </div>
                        </div>

                        {/* CDSCO Status */}
                        <div className="mt-6 rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
                            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                CDSCO Status
                            </p>
                            <p className="mt-2 font-medium text-slate-200">
                                {med.cdsco_approval_status?.toUpperCase() || "UNKNOWN"}
                            </p>
                            {med.is_counterfeit_alert && (
                                <div className="mt-3 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm font-medium text-red-400">
                                    ⚠️ Counterfeit alert registered
                                </div>
                            )}
                        </div>

                        {/* Offline cache notice */}
                        <div className="mt-6 rounded border border-slate-700/50 bg-slate-800/20 p-3 text-xs text-slate-400">
                            💾 This data was cached on {formatTime(selectedScan.scannedAt)} while
                            online. Re-verify online when connection is restored for latest
                            information.
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // ─── Offline state ────────────────────────────────────────────────────────
    return (
        <main className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            {/* Background glow blobs */}
            <div className="pointer-events-none absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-amber-500/5 blur-3xl" />
            <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />

            <div className="relative flex flex-1 flex-col items-center justify-center text-center">
                {/* Icon */}
                <div className="relative mx-auto mb-8 h-28 w-28">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-amber-500/20" />
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-amber-500/30 bg-gradient-to-br from-amber-500/30 to-amber-600/20 backdrop-blur-sm">
                        <WifiOff size={52} className="text-amber-400" />
                    </div>
                </div>

                {/* Headline */}
                <h1 className="mb-3 text-4xl font-bold tracking-tight text-white">{t("title")}</h1>
                <p className="mb-2 text-lg leading-relaxed text-slate-400">{t("description")}</p>
                <p className="mb-10 text-sm leading-relaxed text-slate-500">
                    {t("subtitle")}
                    {retryCount > 0 && (
                        <span className="ml-1 text-amber-400">{t("attempt", { retryCount })}</span>
                    )}
                </p>

                {/* Action buttons */}
                <div className="mb-10 w-full max-w-md space-y-3">
                    <button
                        id="offline-retry-btn"
                        onClick={handleRetry}
                        disabled={isRetrying}
                        className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-500 hover:to-emerald-400 hover:shadow-emerald-500/40 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw size={18} className={isRetrying ? "animate-spin" : ""} />
                        {isRetrying ? t("checkingConnection") : t("tryAgain")}
                    </button>

                    <a
                        id="offline-home-btn"
                        href="/"
                        className="block w-full rounded-xl border border-slate-700 bg-slate-800 px-6 py-3.5 font-semibold text-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-700"
                    >
                        <span className="inline-flex items-center justify-center gap-2.5">
                            <Home size={18} />
                            {t("goHome")}
                        </span>
                    </a>
                </div>
            </div>

            {/* ─── Cached Scan History Section (if available) ──────────────── */}
            {!isLoadingHistory && history.length > 0 && (
                <div className="relative border-t border-slate-800 pt-8">
                    <h2 className="mb-4 text-lg font-bold text-white">
                        📋 Offline History ({history.length})
                    </h2>
                    <p className="mb-4 text-xs text-slate-500">
                        Previously verified medicines cached for offline access
                    </p>

                    <div className="grid gap-3 md:grid-cols-2">
                        {history.map((entry) => {
                            const statusStyle = getStatusBadgeStyle(entry.status);
                            const StatusIcon = statusStyle.icon;

                            return (
                                <button
                                    key={entry.id}
                                    onClick={() => setSelectedScan(entry)}
                                    className={`rounded-lg border ${statusStyle.bg} hover:border-opacity-100 hover:bg-opacity-30 p-4 text-left transition-all duration-200`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="line-clamp-1 font-semibold text-white">
                                                {entry.result?.verified
                                                    ? entry.result.medicine.brand_name
                                                    : entry.medicineName || "Unknown"}
                                            </h3>
                                            <p className="text-xs text-slate-400">
                                                {formatTime(entry.scannedAt)}
                                            </p>
                                            {entry.result?.verified && entry.result.medicine && (
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {entry.result.medicine.generic_name}
                                                </p>
                                            )}
                                        </div>
                                        <div
                                            className={`flex shrink-0 items-center gap-2 ${statusStyle.text}`}
                                        >
                                            <StatusIcon size={16} />
                                            <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Empty state for cached scans */}
            {!isLoadingHistory && history.length === 0 && (
                <div className="relative border-t border-slate-800 pt-8">
                    <p className="text-center text-sm text-slate-500">
                        No cached medicine verifications yet. Verify medicines while online to
                        access them offline.
                    </p>
                </div>
            )}

            {/* Feature chips */}
            <div className="relative border-t border-slate-800 pt-8">
                <p className="mb-4 text-center text-xs font-medium tracking-widest text-slate-500 uppercase">
                    {t("cachedAvailable")}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                    {[
                        { icon: ShieldCheck, label: t("cachedVerifications") },
                        { icon: MapPin, label: t("savedPharmacies") },
                        { icon: Pill, label: t("browsedMedicines") },
                    ].map(({ icon: Icon, label }) => (
                        <div
                            key={label}
                            className="flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-400"
                        >
                            <Icon size={12} />
                            {label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Brand footer */}
            <p className="relative mt-8 text-center text-xs text-slate-600">{t("footer")}</p>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        .animate-fadeIn  { animation: fadeIn  0.5s ease-out forwards; }
        .animate-progress { animation: progress 1.6s ease-in-out forwards; }
      `}</style>
        </main>
    );
}
