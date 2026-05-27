import { Outlet } from '@tanstack/react-router'

// Nav is now in RootLayout — this layout just provides the content wrapper
export function UserLayout() {
  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
      <Outlet />
    </div>
  )
}
