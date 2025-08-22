export default function parseNumber(value: string | undefined): number | null {
    if (!value || value === "-") return null;
    return parseFloat(value.replace(",", "."));
}
