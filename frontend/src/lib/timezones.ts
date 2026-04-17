export function getTimezoneOptions(): { value: string; label: string }[] {
    let zones: string[] = [];
    try {
        // modern browsers support Intl.supportedValuesOf('timeZone')
        if ((Intl as any).supportedValuesOf) {
            zones = (Intl as any).supportedValuesOf('timeZone') as string[];
        }
    } catch (e) {
        // ignore
    }

    if (!zones || zones.length === 0) {
        zones = [
            'UTC',
            'America/New_York',
            'America/Los_Angeles',
            'Europe/London',
            'Europe/Berlin',
            'Asia/Kolkata',
            'Asia/Tokyo',
            'Australia/Sydney'
        ];
    }

    return zones.map((z) => ({ value: z, label: z.replace(/_/g, ' ').replace('/', ' — ') }));
}

export default getTimezoneOptions;
