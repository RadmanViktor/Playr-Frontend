import { Card } from '../components/ui/Card'

export default function HomePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-text">Home</h1>
      <Card>
        <p className="text-muted">Feed coming soon</p>
      </Card>
    </div>
  )
}
