import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function OutOfOffice() {
    return (
        <div className="space-y-6">
            <PageHeader title="Out of office" subtitle="Temporarily redirect visitors while you're away" />

            <Card>
                <div className="space-y-3">
                    <p className="text-sm text-cal-text-muted">Temporarily redirect visitors while you're away. Enter a URL to redirect public pages.</p>
                    <div className="flex gap-2">
                        <input placeholder="https://example.com/redirect" className="cal-input flex-1" />
                        <Button>Save</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default OutOfOffice;
