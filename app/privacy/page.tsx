import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/landing" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-8 inline-block">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-400 mb-10">Last updated: April 2026</p>

        <div className="prose prose-zinc max-w-none space-y-8 text-sm text-zinc-700 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-2">1. About this policy</h2>
            <p>
              Brian (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting your personal information in accordance with the <strong>Privacy Act 1988 (Cth)</strong> and the <strong>Australian Privacy Principles (APPs)</strong>. This policy explains what information we collect, how we use it, and your rights in relation to it.
            </p>
            <p className="mt-2">
              By creating an account and using Brian, you agree to the practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-2">2. What information we collect</h2>
            <p>We collect only what is necessary to provide the service:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Account information</strong> — your email address and password (stored securely via Supabase Auth)</li>
              <li><strong>Transaction data</strong> — CSV files you upload containing your bank transaction history, including dates, amounts, descriptions, and account details</li>
              <li><strong>Categorisation data</strong> — categories, subcategories, and custom rules you create within the app</li>
              <li><strong>Usage data</strong> — basic technical information such as browser type and session activity, collected automatically</li>
            </ul>
            <p className="mt-2">
              We do not collect your bank login credentials, card numbers, or any payment information.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-2">3. How we use your information</h2>
            <p>Your information is used solely to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Provide, operate, and improve the Brian service</li>
              <li>Authenticate your account and maintain your session</li>
              <li>Store and display your transaction history and categorisation rules</li>
              <li>Send account-related communications (e.g. password reset emails)</li>
            </ul>
            <p className="mt-2">
              We do not sell, rent, or share your personal information with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-2">4. How your data is stored</h2>
            <p>
              Brian uses <strong>Supabase</strong> to store your account and transaction data. Supabase stores data on infrastructure hosted in Australia or the United States depending on the region configuration. All data is encrypted at rest and in transit using industry-standard TLS encryption.
            </p>
            <p className="mt-2">
              Row-level security is enforced at the database level, meaning your data is only accessible to your authenticated account.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-2">5. Overseas disclosure</h2>
            <p>
              Some of our infrastructure providers (including Supabase and Vercel) may store or process data outside Australia, including in the United States. We take reasonable steps to ensure these providers maintain appropriate data protection standards consistent with the APPs.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-2">6. Your rights</h2>
            <p>Under the Privacy Act 1988 and the APPs, you have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate or out-of-date information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Make a complaint about how we handle your personal information</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, contact us at the email address below. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-2">7. Data retention</h2>
            <p>
              We retain your data for as long as your account is active. If you delete your account, your personal information and transaction data will be permanently deleted from our systems within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-2">8. Cookies and tracking</h2>
            <p>
              Brian uses session cookies to maintain your authenticated state. We do not use tracking cookies or third-party advertising cookies. We do not use analytics platforms that share your data with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-2">9. Children</h2>
            <p>
              Brian is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-2">10. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. Material changes will be communicated by updating the date at the top of this page. Continued use of Brian after changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-2">11. Contact and complaints</h2>
            <p>
              For privacy-related enquiries, requests, or complaints, contact us at:
            </p>
            <p className="mt-2 font-medium text-zinc-900">jlglasgow123@gmail.com</p>
            <p className="mt-2">
              If you are not satisfied with our response, you may contact the <strong>Office of the Australian Information Commissioner (OAIC)</strong> at <strong>oaic.gov.au</strong> or by calling 1300 363 992.
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}
