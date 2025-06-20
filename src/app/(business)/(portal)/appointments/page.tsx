import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Termine</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre Termine
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kommt bald</CardTitle>
          <CardDescription>
            Die Terminverwaltung wird in Phase 3 implementiert
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Hier werden Sie bald Ihre Termine verwalten können:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground">
            <li>Kalenderansicht</li>
            <li>Termindetails</li>
            <li>Stornierungen verwalten</li>
            <li>Kundenkommunikation</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}