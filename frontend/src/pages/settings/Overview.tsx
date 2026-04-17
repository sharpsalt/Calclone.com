import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { User, Settings, Calendar, Video, Palette, Clock, Shield, Key, Layers, Code, ChevronRight } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';

function RowItem({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between gap-4 rounded-lg px-6 py-5 hover:bg-white/4 transition duration-150 ease-out hover:shadow-[0_10px_40px_rgba(0,0,0,0.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/10"
      aria-label={title}
    >
      <div className="flex items-start gap-4">
        <div className="cal-icon">{icon}</div>
        <div>
          <div className="text-lg font-semibold text-cal-text-primary">{title}</div>
          <div className="text-sm text-cal-text-muted mt-1 max-w-[380px]">{desc}</div>
        </div>
      </div>

      <ChevronRight size={18} className="text-cal-text-dimmed group-hover:text-cal-text-primary" />
    </Link>
  );
}

export function Overview() {
  const user = useUserStore((s) => s.user);

  return (
    <div className="space-y-10">
      <div className="mx-auto max-w-[1160px]">
        <PageHeader
          title="Settings"
          subtitle=""
          actions={
            <div className="w-80">
              <input placeholder="Search" className="w-full rounded-md border border-cal-border bg-cal-bg-subtle px-3 py-2 text-sm text-cal-text-muted" />
            </div>
          }
        />
      </div>

      <div>
        <h3 className="text-base font-semibold text-cal-text-muted mb-6">Personal settings</h3>

        <div className="mx-auto w-full max-w-full sm:max-w-[720px] md:max-w-[940px] lg:max-w-[1160px]">
          <Card noPadding className="cal-card-lg rounded-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <RowItem to="/settings/profile" icon={<User size={20} />} title="Profile" desc="Manage your profile details or delete your account" />
              <RowItem to="/settings/general" icon={<Settings size={20} />} title="General" desc="Manage language, timezone, and other preferences" />
              <RowItem to="/settings/calendars" icon={<Calendar size={20} />} title="Calendars" desc="Connect and manage your calendar integrations" />
              <RowItem to="/settings/conferencing" icon={<Video size={20} />} title="Conferencing" desc="Configure your video conferencing apps" />
              <RowItem to="/settings/appearance" icon={<Palette size={20} />} title="Appearance" desc="Customize your booking page theme and branding" />
            </div>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-cal-text-muted mb-6">Security</h3>
        <div className="mx-auto w-full max-w-full sm:max-w-[720px] md:max-w-[940px] lg:max-w-[1160px]">
          <Card noPadding className="cal-card-lg rounded-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <RowItem to="/settings/password" icon={<Key size={20} />} title="Password" desc="Update your password or sign-in method" />
              <RowItem to="/settings/impersonation" icon={<User size={20} />} title="Impersonation" desc="Allow support to sign in on your behalf" />
              <RowItem to="/settings/compliance" icon={<Shield size={20} />} title="Compliance" desc="Manage data compliance and privacy settings" />
            </div>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-cal-text-muted mb-6">Developer</h3>
        <div className="mx-auto w-full max-w-full sm:max-w-[720px] md:max-w-[940px] lg:max-w-[1160px]">
          <Card noPadding className="cal-card-lg rounded-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <RowItem to="/settings/webhooks" icon={<Layers size={20} />} title="Webhooks" desc="Manage webhooks for event notifications" />
              <RowItem to="/settings/api-keys" icon={<Key size={20} />} title="API keys" desc="Create and manage API keys" />
              <RowItem to="/settings/oauth-clients" icon={<Code size={20} />} title="OAuth Clients" desc="Manage OAuth applications and clients" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Overview;
