import Script from 'next/script'

interface StructuredDataScriptProps {
  data: Record<string, any> | Record<string, any>[]
}

export function StructuredDataScript({ data }: StructuredDataScriptProps) {
  const jsonLd = Array.isArray(data) ? data : [data]

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
      strategy="afterInteractive"
    />
  )
}