import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b-2 border-accent sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-2xl">👨‍👩‍👧‍👦</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-textPrimary group-hover:text-primary transition-colors">
                Parent Hacks
              </h1>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link 
                  to="/submit" 
                  className="px-4 py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all hidden sm:block"
                >
                  + Submit Hack
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-primary/10 text-textPrimary font-medium transition-all"
                >
                  <span className="hidden sm:inline">{profile?.username || 'Profile'}</span>
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {(profile?.username?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </div>
                </Link>
              </>
            ) : (
              <Link 
                to="/auth" 
                className="px-4 py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {children}
      </main>

      <footer className="border-t-2 border-accent bg-card mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-textMuted text-sm">
          <p>Made with ❤️ by parents, for parents</p>
        </div>
      </footer>
    </div>
  )
}
