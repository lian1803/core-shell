import { HistoryList } from '@/components/history/HistoryList'

export default function HistoryPage() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">발행 히스토리</h1>
      <HistoryList />
    </div>
  )
}
