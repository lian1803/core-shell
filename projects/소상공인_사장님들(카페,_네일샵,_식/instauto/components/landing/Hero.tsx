import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-gray-50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              인스타 콘텐츠,
              <br />
              <span className="text-primary">AI가 매일 만들어요</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
              가게 정보만 입력하면 AI가 매일 아침 8시,
              <br />
              분위기 있는 이미지와 캡션을 자동으로 생성합니다
            </p>
          </div>

          <div className="space-y-4">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-8 text-lg">
                14일 무료 체험 시작
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              신용카드 등록 없이 바로 시작하세요
            </p>
          </div>

          <div className="w-full max-w-4xl mt-12">
            <div className="rounded-xl border bg-white shadow-2xl overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="text-6xl">📸</div>
                  <p className="text-sm text-muted-foreground">
                    데모 이미지
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
