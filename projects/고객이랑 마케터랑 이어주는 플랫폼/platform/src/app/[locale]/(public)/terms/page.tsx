import { getTranslations, setRequestLocale } from 'next-intl/server'

export default async function TermsPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  setRequestLocale(locale)
  const tc = await getTranslations('common')

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight mb-8">
        {tc('terms')}
      </h1>

      <div className="prose prose-sm max-w-none text-text-secondary flex flex-col gap-6">
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">1. General Terms</h2>
          <p>
            These Terms of Service govern your use of the Platform service. By accessing or using our service,
            you agree to be bound by these terms. If you do not agree, please do not use our service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">2. User Accounts</h2>
          <p>
            You are responsible for maintaining the security of your account and password. The platform
            cannot and will not be liable for any loss or damage from your failure to comply with this
            security obligation.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">3. Service Usage</h2>
          <p>
            Users must not misuse the service. This includes but is not limited to: attempting to access
            the service through unauthorized means, interfering with the service operations, or submitting
            false or misleading information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">4. Limitation of Liability</h2>
          <p>
            The platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We make no warranties,
            expressed or implied, and hereby disclaim all warranties including, without limitation,
            implied warranties of merchantability and fitness for a particular purpose.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">5. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify users of any
            significant changes through the service or via email.
          </p>
        </section>
      </div>
    </div>
  )
}
