import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Switch } from '../../components/ui/Switch';

export function PushNotifications() {
    return (
        <div className="space-y-6">
            <PageHeader title="Push notifications" subtitle="Manage push notification settings" />

            <Card>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-cal-text-primary">Desktop notifications</h3>
                        <p className="text-sm text-cal-text-muted mt-1">Enable desktop notifications for upcoming events.</p>
                    </div>
                    <Switch checked={false} onChange={() => {}} />
                </div>
            </Card>
        </div>
    );
}

export default PushNotifications;
