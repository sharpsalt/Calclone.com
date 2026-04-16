import { Shell } from '../components/layout/Shell';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';

export function RoadmapPage() {
    return (
        <Shell>
            <PageHeader title="Roadmap" subtitle="Planned features and roadmap." />
            <div className="grid gap-4">
                <Card>
                    <div className="px-6 py-6">
                        <h2 className="text-xl font-semibold text-cal-text-primary">Delivered</h2>
                        <p className="mt-3 text-cal-text-default">
                            Implemented Stale-While-Revalidate caching strategy on public event pages to handle 1M+ read requests without hitting Postgres.
                        </p>
                    </div>
                </Card>

                <Card>
                    <div className="px-6 py-6">
                        <h2 className="text-xl font-semibold text-cal-text-primary">Infrastructure Rollout</h2>
                        <ul className="mt-4 list-disc space-y-2 pl-5 text-cal-text-default">
                            <li>CDN/edge caching and ISR/SSG strategy.</li>
                            <li>Read-replica/PgBouncer/sharding infrastructure rollout.</li>
                            <li>Production email provider wiring in worker (currently scaffolded/logged).</li>
                        </ul>
                    </div>
                </Card>
            </div>
        </Shell>
    );
}
