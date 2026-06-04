import { useTranslations } from "next-intl";

export interface Medicine {
    id: string;
    brand_name: string | null;
    generic_name: string;
    composition: string | null;
    manufacturer: string;
    mrp?: number | null;
    jan_aushadhi_price?: number | null;
    expiry_date?: string | null;
    medicine_type?: "brand" | "generic";
    cdsco_approval_status: string;
}

function hasValidMrp(m: Medicine | null | undefined): m is Medicine & { mrp: number } {
    return m != null && m.mrp != null && Number.isFinite(m.mrp) && m.mrp >= 0;
}

function formatExpiry(iso: string | null | undefined): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function displayName(m: Medicine): string {
    return m.brand_name?.trim() || m.generic_name;
}

function formatStatus(status: string, t: ReturnType<typeof useTranslations>): string {
    const map: Record<string, string> = {
        approved: t("status.approved"),
        recalled: t("status.recalled"),
        banned: t("status.banned"),
    };
    return map[status.toLowerCase()] ?? status;
}

function hasValidJanAushadhiPrice(
    m: Medicine | null | undefined
): m is Medicine & { jan_aushadhi_price: number } {
    return (
        m != null &&
        m.jan_aushadhi_price != null &&
        Number.isFinite(m.jan_aushadhi_price) &&
        m.jan_aushadhi_price >= 0
    );
}

function computeSavingsPercent(higher: number, lower: number): number {
    if (higher <= 0) return 0;
    return ((higher - lower) / higher) * 100;
}

function formatPrice(value: number | null | undefined, unavailableText: string): string {
    return value != null ? `₹${value.toFixed(2)}` : unavailableText;
}

function getSavingsText(medicine: Medicine | null, t: ReturnType<typeof useTranslations>): string {
    if (!medicine || !hasValidMrp(medicine) || !hasValidJanAushadhiPrice(medicine)) {
        return t("priceUnavailable");
    }

    if (medicine.mrp <= medicine.jan_aushadhi_price) {
        return t("noSavings");
    }

    const amount = medicine.mrp - medicine.jan_aushadhi_price;
    const percent = computeSavingsPercent(medicine.mrp, medicine.jan_aushadhi_price);
    return t("saveAmount", { amount: amount.toFixed(2), percent: percent.toFixed(1) });
}

export default function ComparisonGrid({
    medicine1,
    medicine2,
}: {
    medicine1: Medicine | null;
    medicine2: Medicine | null;
}) {
    const t = useTranslations("Compare");

    if (!medicine1 && !medicine2) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white py-14 text-center text-slate-500">
                {t("emptyComparison")}
            </div>
        );
    }

    const rows: { label: string; getValue: (m: Medicine) => string }[] = [
        { label: t("rows.brandName"), getValue: (m) => m.brand_name?.trim() || "—" },
        { label: t("rows.genericName"), getValue: (m) => m.generic_name },
        { label: t("rows.composition"), getValue: (m) => m.composition?.trim() || "—" },
        { label: t("rows.manufacturer"), getValue: (m) => m.manufacturer },
        {
            label: t("rows.type"),
            getValue: (m) =>
                m.medicine_type ??
                (m.brand_name?.trim() ? t("medicineTypes.brand") : t("medicineTypes.generic")),
        },
        {
            label: t("rows.cdscoStatus"),
            getValue: (m) => formatStatus(m.cdsco_approval_status, t),
        },
        { label: t("rows.expiryDate"), getValue: (m) => formatExpiry(m.expiry_date) },
        {
            label: t("rows.marketPrice"),
            getValue: (m) => formatPrice(m.mrp, t("priceUnavailable")),
        },
        {
            label: t("rows.janAushadhiPrice"),
            getValue: (m) => formatPrice(m.jan_aushadhi_price, t("priceUnavailable")),
        },
        { label: t("rows.savings"), getValue: (m) => getSavingsText(m, t) },
    ];

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="w-1/4 px-5 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
                            {t("fieldHeader")}
                        </th>
                        <th className="px-5 py-3 text-center text-sm font-semibold text-slate-800">
                            {medicine1 ? displayName(medicine1) : t("medicineA")}
                        </th>
                        <th className="px-5 py-3 text-center text-sm font-semibold text-slate-800">
                            {medicine2 ? displayName(medicine2) : t("medicineB")}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(({ label, getValue }) => (
                        <tr key={label} className="border-b border-slate-100 last:border-0">
                            <td className="px-5 py-3 font-medium text-slate-600">{label}</td>
                            <td className="px-5 py-3 text-center text-slate-800">
                                {medicine1 ? getValue(medicine1) : "—"}
                            </td>
                            <td className="px-5 py-3 text-center text-slate-800">
                                {medicine2 ? getValue(medicine2) : "—"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
