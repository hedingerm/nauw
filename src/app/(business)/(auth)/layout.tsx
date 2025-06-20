import { NavigationHeader } from '@/src/components/features/navigation-header'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <NavigationHeader />
      {children}
    </>
  )
}