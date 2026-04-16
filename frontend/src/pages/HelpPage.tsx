import { Shell } from '../components/layout/Shell';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';

export function HelpPage() {
    return (
        <Shell>
            <PageHeader title="Help" subtitle="Support resources and documentation." />
            <Card>
                <div className="px-6 py-6 text-cal-text-muted">Help center content goes here. Link to docs, contact, or FAQs.</div>
            </Card>
        </Shell>
    );
}
