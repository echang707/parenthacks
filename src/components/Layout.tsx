import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../lib/AuthContext";

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <header className="bg-card/80 backdrop-blur-md border-b-2 border-accent/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            {/* Tiger Logo */}
            <div className="relative">
              <img 
                src="/tiger-logo.png" 
                alt="Parent Hacks" 
                className="h-14 w-14 object-contain group-hover:scale-110 transition-transform drop-shadow-lg"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent group-hover:from-primary/80 group-hover:to-primary transition-all">
                Parent Hacks
              </h1>
              <p className="text-xs text-textMuted">Real solutions from real parents</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link 
                  to="/submit" 
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-medium hover:shadow-lg hover:scale-105 transition-all duration-200 hidden sm:flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Submit Hack
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-primary/10 text-textPrimary font-medium transition-all hover:scale-105 duration-200"
                >
                  <span className="hidden sm:inline">{profile?.username || 'Profile'}</span>
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
                    {(profile?.username?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </div>
                </Link>
              </>
            ) : (
              <Link 
                to="/auth" 
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
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

      <footer className="border-t-2 border-accent/50 bg-card/50 backdrop-blur-sm mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-textPrimary font-semibold">Parent Hacks</p>
              <p className="text-sm text-textMuted">Made with ❤️ by parents, for parents</p>
            </div>
            <div className="flex gap-6 text-sm text-textMuted">
              <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              <Link to="/submit" className="hover:text-primary transition-colors">Submit</Link>
              {user && <Link to="/profile" className="hover:text-primary transition-colors">Profile</Link>}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
