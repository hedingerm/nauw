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
        </div>
      </div>
    </footer>
  )
}