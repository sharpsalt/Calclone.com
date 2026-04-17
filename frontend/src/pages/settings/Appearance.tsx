import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Switch } from '../../components/ui/Switch';

export function Appearance() {
    return (
        <div className="space-y-6">
            <PageHeader title="Appearance" subtitle="Customize look and feel of the app" />

            <Card>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-cal-text-primary">Theme</h3>
                        <p className="text-sm text-cal-text-muted mt-1">Choose light or dark appearance</p>
                    </div>
                    <div>
                        <Switch checked={true} onChange={() => {}} />
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default Appearance;
