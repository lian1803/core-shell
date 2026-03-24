import { getTranslations, setRequestLocale } from 'next-intl/server'

export default async function PrivacyPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  setRequestLocale(locale)
  const tc = await getTranslations('common')

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight mb-8">
        {tc('privacy')}
      </h1>

      <div className="prose prose-sm max-w-none text-text-secondary flex flex-col gap-6">
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create an account,
            submit a request, or contact us. This may include your name, email address, business
            information, and other details you choose to provide.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to provide, maintain, and improve our services,
            to process transactions, to send you technical notices and support messages, and
            to respond to your comments and questions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">3. Information Sharing</h2>
          <p>
            We do not sell or rent your personal information to third parties. We may share your
            information with service providers who perform services on our behalf, or when required
            by law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">4. Data Security</h2>
          <p>
            We take reasonable measures to help protect your personal information from loss, theft,
            misuse, and unauthorized access. However, no internet transmission is completely secure.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">5. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us through
            the platform.
          </p>
        </section>
      </div>
    </div>
  )
}
