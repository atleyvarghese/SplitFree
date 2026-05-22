import { ArrowRight, Users, Receipt, TrendingUp, Upload } from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">SplitFree</span>
        </div>
        <div className="flex gap-3">
          <LinkButton href="/login" variant="ghost">Log in</LinkButton>
          <LinkButton href="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white">Get started free</LinkButton>
        </div>
      </nav>

      <section className="text-center px-6 py-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <span>100% Free · No ads · No premium tiers</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Split expenses,<br />
          <span className="text-indigo-600">zero cost</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Track shared expenses with friends and groups. Import from Splitwise. Always free, no ads, no paywalls.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <LinkButton href="/register" size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white text-base px-8">
            Start for free <ArrowRight className="ml-2 w-5 h-5" />
          </LinkButton>
          <LinkButton href="/login" size="lg" variant="outline" className="text-base px-8">
            Sign in
          </LinkButton>
        </div>
      </section>

      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Users,
              title: 'Groups & friends',
              desc: 'Create groups for trips, households, or any shared expense.',
            },
            {
              icon: Receipt,
              title: 'Flexible splits',
              desc: 'Split equally, by %, by exact amounts, or by shares.',
            },
            {
              icon: TrendingUp,
              title: 'Live balances',
              desc: 'See who owes who in real-time. Settle up with one tap.',
            },
            {
              icon: Upload,
              title: 'Splitwise import',
              desc: 'Upload your Splitwise export CSV and migrate instantly.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-10 text-gray-400 text-sm">
        <p>SplitFree · Free forever · No ads · No paywalls</p>
      </footer>
    </div>
  )
}
