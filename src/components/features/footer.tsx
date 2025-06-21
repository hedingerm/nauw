import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase mb-4">
              Kontakt
            </h3>
            <div className="text-gray-400 text-sm space-y-1">
              <p>Hedinger-Digital</p>
              <p>Rosgartenstrasse 19</p>
              <p>7205 Zizers, Schweiz</p>
              <p className="mt-2">+41 81 511 23 41</p>
              <p>support@nauw.ch</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase mb-4">
              Rechtliches
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/impressum" className="text-gray-400 hover:text-gray-300 text-sm">
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="text-gray-400 hover:text-gray-300 text-sm">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link href="/agb" className="text-gray-400 hover:text-gray-300 text-sm">
                  AGB
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase mb-4">
              Service
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/kontakt" className="text-gray-400 hover:text-gray-300 text-sm">
                  Kontakt
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-400 hover:text-gray-300 text-sm">
                  Kostenlos starten
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-400 hover:text-gray-300 text-sm">
                  Anmelden
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8">
          <p className="text-center text-xs leading-5 text-gray-400">
            &copy; {new Date().getFullYear()} nauw. Alle Rechte vorbehalten.
          </p>
          
          {/* Payment Methods */}
          <div className="mt-8 flex flex-col items-center space-y-4">
            <p className="text-xs text-gray-500">Sichere Zahlungen mit</p>
            <div className="flex items-center space-x-4">
              {/* Visa */}
              <svg className="h-8 w-auto" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="32" rx="4" fill="#F6F6F6"/>
                <path d="M20.5 22H16.8L19.1 10H22.8L20.5 22Z" fill="#00579F"/>
                <path d="M32.5 10.4C31.8 10.1 30.6 9.8 29.2 9.8C25.5 9.8 22.9 11.6 22.9 14.2C22.9 16.1 24.8 17.1 26.2 17.7C27.7 18.3 28.2 18.7 28.2 19.3C28.2 20.2 27 20.6 25.9 20.6C24.3 20.6 23.4 20.3 22 19.6L21.4 19.3L20.8 22.8C21.8 23.3 23.6 23.7 25.5 23.7C29.5 23.7 32 21.9 32 19.1C32 17.5 31 16.4 28.8 15.5C27.5 14.9 26.7 14.5 26.7 13.9C26.7 13.3 27.4 12.7 28.8 12.7C30 12.7 30.9 12.9 31.6 13.2L32 13.4L32.5 10.4Z" fill="#00579F"/>
                <path d="M37.8 10H35C34.1 10 33.5 10.3 33.1 11.2L27.9 22H31.9L32.7 20H37.4L37.9 22H41.4L37.8 10ZM33.8 17.2C34.1 16.4 35.2 13.5 35.2 13.5C35.2 13.5 35.5 12.6 35.7 12L36 13.4C36 13.4 36.7 16.5 36.9 17.2H33.8Z" fill="#00579F"/>
                <path d="M14.1 10L10.4 18.2L10 16.1C9.3 13.9 7.2 11.5 4.9 10.3L8.2 22H12.2L18.1 10H14.1Z" fill="#00579F"/>
                <path d="M8.5 10H2.1L2 10.3C7 11.6 10.3 14.7 11.5 18L10.3 11.2C10.1 10.3 9.5 10 8.5 10Z" fill="#FAA61A"/>
              </svg>
              
              {/* Mastercard */}
              <svg className="h-8 w-auto" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="32" rx="4" fill="#F6F6F6"/>
                <circle cx="19" cy="16" r="9" fill="#EB001B"/>
                <circle cx="29" cy="16" r="9" fill="#F79E1B"/>
                <path d="M24 10.5C25.8 12 27 14.3 27 16.9C27 19.5 25.8 21.8 24 23.3C22.2 21.8 21 19.5 21 16.9C21 14.3 22.2 12 24 10.5Z" fill="#FF5F00"/>
              </svg>
              
              {/* American Express */}
              <svg className="h-8 w-auto" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="32" rx="4" fill="#2E77BB"/>
                <path d="M10 18L11.5 14H12.5L14 18H13L12.6 17H11.4L11 18H10ZM11.7 16H12.3L12 15L11.7 16Z" fill="white"/>
                <path d="M14 18V14H15L16 16L17 14H18V18H17V15.5L16 17.5H16L15 15.5V18H14Z" fill="white"/>
                <path d="M19 18V14H22V15H20V15.5H22V16.5H20V17H22V18H19Z" fill="white"/>
                <path d="M23 18V14H24.5C25.3 14 26 14.2 26 15C26 15.5 25.7 15.7 25.5 15.8L26 18H25L24.6 16H24V18H23ZM24 15.5H24.5C24.8 15.5 25 15.4 25 15C25 14.6 24.8 14.5 24.5 14.5H24V15.5Z" fill="white"/>
                <path d="M27 18V14H28V18H27Z" fill="white"/>
                <path d="M29 18V14H30L31 16V14H32V18H31L30 16V18H29Z" fill="white"/>
              </svg>
              
              {/* Stripe Badge */}
              <div className="flex items-center space-x-1 text-gray-400">
                <span className="text-xs">Powered by</span>
                <svg className="h-4 w-auto" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M59.64 11.18c0-4.1-2-7.33-6.34-7.33-4.36 0-7.03 3.23-7.03 7.28 0 4.8 2.87 7.3 7.6 7.3 2.18 0 3.82-.5 5.05-1.18v-3.55c-1.23.6-2.62.96-4.48.96-1.78 0-3.35-.62-3.55-2.77h8.7c0-.2.05-.98.05-1.71zm-8.8-1.57c0-2.06 1.26-2.9 2.42-2.9 1.13 0 2.3.84 2.3 2.9h-4.72zM40.72 4.13c-1.8 0-2.96.85-3.6 1.44l-.24-1.14h-4.15v17.4l4.63-.98v-4.24c.66.48 1.63 1.16 3.3 1.16 3.35 0 6.4-2.7 6.4-7.42 0-4.47-3.1-7.22-6.34-7.22zm-1.16 10.8c-1.1 0-1.74-.4-2.18-.88V8.88c.48-.53 1.13-.9 2.18-.9 1.66 0 2.82 1.86 2.82 3.92 0 2.12-1.13 4.02-2.82 4.02zm-12.4-11.1l-4.66.98v11.66h4.65V9.6c1.1-1.43 2.96-1.16 3.54-.96V4.23c-.6-.22-2.82-.63-3.92.95l-.24-.95h-4.02M19.14 2.33l-4.6.96v3.02l4.6-.97V2.33zM14.54 4.43h4.6v12.04h-4.6V4.43zM10.23 4.68L9.9 4.43H5.63v12.04h4.63V9.7c1.1-1.4 3.7-1.14 3.7-1.14V4.43s-2.5-.24-3.73 1.14V4.68zM0 11.04c0 2.7.8 4.32 2.8 5.1 1.5.58 3.54.64 5.36.53v-3.15c-1.7.14-3.92.3-3.92-1.47V7.82h3.92v-3.4H4.24V0L0 .84v3.58l-.02 6.62z" fill="#6B7280"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}