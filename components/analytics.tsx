import Script from 'next/script'

// Read at build time (this is a static export). To enable GoatCounter,
// register a site at https://www.goatcounter.com/ and set
//   NEXT_PUBLIC_GOATCOUNTER_CODE=<your-subdomain-prefix>
// in `.env.local` (or your CI secret) before `pnpm build`.
const GC_CODE = process.env.NEXT_PUBLIC_GOATCOUNTER_CODE

export function Analytics() {
  return (
    <>
      {/*
        busuanzi — zero-config visitor counter, fast inside China.
        Reads DOM elements with these IDs after fetching counts:
          - busuanzi_value_site_pv  / busuanzi_value_site_uv  (site-wide)
          - busuanzi_value_page_pv                            (per-page)
        Containers (`busuanzi_container_*`) are shown only after the count
        arrives, avoiding a flash of "0".
      */}
      <Script
        src="https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"
        strategy="afterInteractive"
      />
      {GC_CODE && (
        <Script
          src="https://gc.zgo.at/count.js"
          strategy="afterInteractive"
          data-goatcounter={`https://${GC_CODE}.goatcounter.com/count`}
        />
      )}
    </>
  )
}
