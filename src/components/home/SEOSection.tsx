import React from 'react'

export function SEOSection() {
  return (
    <section aria-labelledby="faq-heading" className="py-8">
      <h2 id="faq-heading" className="text-xl font-semibold text-gray-900 mb-4">Wine FAQs & Guides</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <article className="rounded-lg border border-gray-200 p-4 bg-white">
          <h3 className="font-medium text-gray-900">Best wine with salmon?</h3>
          <p className="text-sm text-gray-600 mt-1">Pinot Noir or Chardonnay are reliable matches. Learn why acidity and body matter.</p>
          <a href="/chat?q=What%20pairs%20with%20salmon%3F" className="text-sm text-primary mt-2 inline-block">Ask the Sommelier</a>
        </article>
        <article className="rounded-lg border border-gray-200 p-4 bg-white">
          <h3 className="font-medium text-gray-900">Budget-friendly crowd-pleasers</h3>
          <p className="text-sm text-gray-600 mt-1">Explore dependable picks under $25 for weeknight dinners and parties.</p>
          <a href="/chat?q=Recommend%20a%20wine%20under%20%2425" className="text-sm text-primary mt-2 inline-block">See suggestions</a>
        </article>
        <article className="rounded-lg border border-gray-200 p-4 bg-white">
          <h3 className="font-medium text-gray-900">Drinking windows explained</h3>
          <p className="text-sm text-gray-600 mt-1">Know when to open each bottle and get gentle reminders at peak.</p>
          <a href="/settings" className="text-sm text-primary mt-2 inline-block">Configure alerts</a>
        </article>
      </div>
    </section>
  )
}


