## Performance notes (Lighthouse baselines and budgets)

- **Budgets**
  - LCP: ≤ 2500 ms
  - CLS: ≤ 0.10
  - TBT: ≤ 300 ms

- **Latest baselines**
  - Home: LCP ~ 2754 ms, CLS within budget, TBT within budget
    - Report: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1759782907659-41782.report.html
  - Inventory: LCP ~ 2769 ms, CLS within budget, TBT within budget
    - Report: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1759782908559-59258.report.html
  - Chat: LCP ~ 2859 ms, CLS within budget, TBT within budget
    - Report: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1759782909157-17307.report.html

- **Changes implemented**
  - Replaced <img> with Next/Image on key components; added sizes, priority, blur placeholders
  - Added preconnect for Google Fonts; env-based preconnect for Supabase
  - Dynamically imported heavy UI: ChatSidebar, multiple Inventory components, Home Scanner demo and secondary sections
  - Added route-level loading states and skeletons to prevent CLS
  - Enabled bundle analyzer; pruned unused deps (multer, @types/multer, workbox-webpack-plugin)

- **Next steps to hit budgets**
  - Home/Inventory/Chat: further reduce LCP under 2.5s
    - Ensure hero/above-the-fold assets use priority/fetchPriority and explicit dimensions
    - Consider preloading critical font files and inlining minimal critical CSS if needed
    - Review analyzer reports (.next/analyze/*.html) and trim large modules
  - Re-capture LHCI after adjustments and update this doc



