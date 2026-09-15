import { ShieldCheck, ShieldAlert, ListChecks, Users } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth'
import { useVerificationQueue, useActiveRequestsStats } from '@/hooks/use-admin'

export default function AdminProfile() {
  const name = useAuthStore((s) => s.name) ?? 'Admin'
  const email = useAuthStore((s) => s.email)
  const adminRole = useAuthStore((s) => s.adminRole)

  const queue = useVerificationQueue()
  const stats = useActiveRequestsStats()

  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const cards = [
    { label: 'Verification queue', value: queue.data?.length ?? 0, icon: ShieldCheck, to: '/admin/verification' },
    { label: 'Active requests', value: stats.data?.total ?? 0, icon: ListChecks, to: '/admin/requests' },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
              {initials || <ShieldAlert className="h-8 w-8" />}
            </div>
            <div>
              <div className="text-2xl font-semibold">{name}</div>
              <CardDescription className="flex items-center gap-1.5">
                {adminRole === 'superadmin' ? 'Superadmin' : 'Support agent'} · GeoFix admin
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" /> {email ?? 'admin@geofix.app'}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <a key={c.label} href={c.to} className="block">
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="flex items-center gap-3 p-4">
                <c.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-xl font-semibold leading-none">{c.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{c.label}</div>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  )
}
