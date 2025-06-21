<?xml version="1.0" encoding="UTF-8"?>
<StripeWebsiteActivation xmlns="https://stripe.com/schema/website-activation">

  <!-- Immediate Requirements: must be live before account activation -->
  <ImmediateRequirements>
    <BusinessName description="Legal or trade name matching Stripe application data"/>
    <!-- :contentReference[oaicite:0]{index=0} -->
    <Offerings description="Text descriptions of all goods or services offered"/>
    <!-- :contentReference[oaicite:1]{index=1} -->
  </ImmediateRequirements>

  <!-- Sell-Time Requirements: must be present by first transaction -->
  <SellTimeRequirements>
    <TransactionCurrency description="Currency in which you will charge customers"/>
    <!-- :contentReference[oaicite:2]{index=2} -->
    <CustomerService>
      <ContactMethods>
        <Phone allowed="true"/>
        <Email allowed="true"/>
        <Address allowed="true"/>
        <ContactForm allowed="true"/>
        <OnlineMessaging allowed="true"/>
      </ContactMethods>
    </CustomerService>
    <!-- :contentReference[oaicite:3]{index=3} -->
    <ReturnPolicy applicability="physicalGoods" description="Detailed returns process"/>
    <!-- :contentReference[oaicite:4]{index=4} -->
    <RefundPolicy description="Conditions and process for refunds and dispute handling"/>
    <!-- :contentReference[oaicite:5]{index=5} -->
    <CancellationPolicy applicability="services" description="How customers cancel services"/>
    <!-- :contentReference[oaicite:6]{index=6} -->
    <LegalExportRestrictions optional="true" description="Any trade, export, or compliance restrictions"/>
    <!-- :contentReference[oaicite:7]{index=7} -->
    <PromotionsTerms optional="true" description="Terms and conditions for all promotions"/>
    <!-- :contentReference[oaicite:8]{index=8} -->
  </SellTimeRequirements>

  <!-- Technical & Accessibility Requirements -->
  <TechnicalRequirements>
    <Accessibility>
      <PublicAccess passwordProtected="false" description="Site must load without authentication"/>
      <!-- :contentReference[oaicite:9]{index=9} -->
      <GeoBlocking allowed="false" description="No region-based IP blocks during review"/>
      <!-- :contentReference[oaicite:10]{index=10} -->
    </Accessibility>
    <ConstructionStatus description="Site fully built, all live products/services listed"/>
    <!-- :contentReference[oaicite:11]{index=11} -->
    <SocialMediaProfile allowed="true" description="Full profile URL, not just handle"/>
    <!-- :contentReference[oaicite:12]{index=12} -->
  </TechnicalRequirements>

  <!-- Website Ownership Verification -->
  <OwnershipVerification>
    <EmailDomainMatch description="Verify by sending to email at your site’s domain"/>
    <!-- :contentReference[oaicite:13]{index=13} -->
    <MetaTag description="Add Stripe-provided meta tag to <head>"/>
    <!-- :contentReference[oaicite:14]{index=14} -->
    <FileUpload description="Host verification file at root URL"/>
    <!-- :contentReference[oaicite:15]{index=15} -->
    <AlternateExplanation description="Form-based explanation if edits aren’t possible"/>
    <!-- :contentReference[oaicite:16]{index=16} -->
  </OwnershipVerification>

  <!-- Optional Recommendations -->
  <Recommendations>
    <PrivacyPolicy description="Consumer data privacy and cookie usage policy"/>
    <!-- :contentReference[oaicite:17]{index=17} -->
    <SecurityCapabilities description="TLS/SSL details and PCI-compliance statement"/>
    <!-- :contentReference[oaicite:18]{index=18} -->
    <StatementDescriptors description="Dynamic, per-charge descriptors (2–10 letters)"/>
    <!-- :contentReference[oaicite:19]{index=19} -->
  </Recommendations>

</StripeWebsiteActivation>
