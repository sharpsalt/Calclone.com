import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Switch } from '../../components/ui/Switch';

export function Features() {
    return (
        <div className="space-y-6">
            <PageHeader title="Features" subtitle="Enable experimental or advanced features" />

            <Card>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-cal-text-primary">Beta features</h3>
                        <p className="text-sm text-cal-text-muted mt-1">Try early features before they are released.</p>
                    </div>
                    <Switch checked={false} onChange={() => {}} />
                </div>
            </Card>
        </div>
    );
}

export default Features;
