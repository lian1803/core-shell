import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'

const plans = [
  {
    name: '베이직',
    price: '19,900원',
    period: '/ 월',
    description: '소규모 카페에 딱 맞는 플랜',
    features: [
      '매일 AI 콘텐츠 자동 생성',
      '캡션 무제한 수정',
      '재생성 3회/일',
      '이미지 다운로드',
      '발행 히스토리',
    ],
    popular: false,
  },
  {
    name: '프로',
    price: '39,900원',
    period: '/ 월',
    description: '더 많은 창작이 필요한 분들을 위한',
    features: [
      '베이직 플랜 전체 기능',
      '재생성 10회/일',
      '우선 지원',
      '고급 프롬프트 튜닝',
      '향후 자동 발행 기능 우선 제공',
    ],
    popular: true,
  },
]

export function Pricing() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            간단한 요금제
          </h2>
          <p className="mt-4 text-gray-500 md:text-xl">
            14일 무료 체험 후 선택하세요
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${
                plan.popular ? 'border-primary shadow-lg' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    인기
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Link href="/signup" className="w-full">
                  <Button
                    variant={plan.popular ? 'default' : 'outline'}
                    className="w-full h-12"
                  >
                    무료로 시작하기
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        <p className="text-center mt-8 text-sm text-muted-foreground">
          14일 무료 체험 중 언제든지 취소 가능합니다
        </p>
      </div>
    </section>
  )
}
