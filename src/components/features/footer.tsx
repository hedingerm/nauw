import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center space-x-6 md:order-2">
            <Link href="/impressum" className="text-gray-400 hover:text-gray-300">
              Impressum
            </Link>
            <Link href="/datenschutz" className="text-gray-400 hover:text-gray-300">
              Datenschutz
            </Link>
            <Link href="/agb" className="text-gray-400 hover:text-gray-300">
              AGB
            </Link>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-400">
              &copy; {new Date().getFullYear()} nauw. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}