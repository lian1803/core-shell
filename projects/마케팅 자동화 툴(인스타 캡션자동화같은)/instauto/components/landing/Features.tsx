import { Sparkles, Copy, Clock } from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    title: 'AI 자동 생성',
    description:
      '매일 아침 8시, 가게 분위기에 맞는 이미지와 캡션을 AI가 자동으로 만들어드립니다',
  },
  {
    icon: Copy,
    title: '간편한 복사',
    description:
      '생성된 콘텐츠를 복사하고 인스타그램에 붙여넣기만 하면 끝. 3초면 충분합니다',
  },
  {
    icon: Clock,
    title: '발행 히스토리',
    description:
      '지난 콘텐츠를 언제든 다시 확인하고 재사용할 수 있습니다',
  },
]

export function Features() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            이렇게 간단해요
          </h2>
          <p className="mt-4 text-gray-500 md:text-xl">
            복잡한 설정 없이 바로 시작하세요
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl border bg-gray-50 hover:shadow-md transition-shadow"
            >
              <div className="rounded-full bg-primary/10 p-4">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
