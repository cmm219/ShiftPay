import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const linkClasses = ({ isActive }) =>
  `transition-colors duration-200 ${
    isActive
      ? 'text-accent'
      : 'text-text-secondary hover:text-text-primary'
  }`;

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const role = profile?.role;
  const displayName = user?.email || 'Account';

  // Close user menu on outside click (only when menu is open)
  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-surface border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-display italic text-accent">
            ShiftPay
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/browse" className={linkClasses}>
              Browse
            </NavLink>

            {!user && (
              <>
                <NavLink to="/login" className={linkClasses}>
                  Login
                </NavLink>
                <div className="relative group">
                  <span className="text-text-secondary hover:text-text-primary transition-colors duration-200 cursor-pointer">
                    Sign Up
                  </span>
                  <div className="absolute top-full right-0 pt-2 hidden group-hover:block">
                    <div className="bg-bg-surface border border-border-subtle rounded-lg shadow-xl py-2 min-w-[180px]">
                      <Link
                        to="/worker/signup"
                        className="block px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
                      >
                        I'm a Worker
                      </Link>
                      <Link
                        to="/restaurant/signup"
                        className="block px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
                      >
                        I'm a Restaurant
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}

            {user && role === 'restaurant' && (
              <NavLink to="/post-shift" className={linkClasses}>
                Post a Shift
              </NavLink>
            )}

            {user && (
              <>
                <NavLink
                  to={role === 'restaurant' ? '/dashboard/restaurant' : '/dashboard/worker'}
                  className={linkClasses}
                >
                  Dashboard
                </NavLink>

                {/* User menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors duration-200 cursor-pointer"
                  >
                    <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-semibold">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                    <span className="max-w-[120px] truncate text-sm">{displayName}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 bg-bg-surface border border-border-subtle rounded-lg shadow-xl py-2 min-w-[180px]">
                      <div className="px-4 py-2 border-b border-border-subtle">
                        <p className="text-sm text-text-primary truncate">{displayName}</p>
                        <p className="text-xs text-text-muted capitalize">{role || 'User'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-text-secondary hover:text-danger hover:bg-bg-surface-hover transition-colors cursor-pointer"
                      >
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-bg-surface border-t border-border-subtle">
          <div className="px-4 py-4 flex flex-col gap-4">
            <NavLink to="/browse" className={linkClasses} onClick={() => setMobileOpen(false)}>
              Browse
            </NavLink>

            {!user && (
              <>
                <NavLink to="/login" className={linkClasses} onClick={() => setMobileOpen(false)}>
                  Login
                </NavLink>
                <NavLink to="/worker/signup" className={linkClasses} onClick={() => setMobileOpen(false)}>
                  Sign Up as Worker
                </NavLink>
                <NavLink to="/restaurant/signup" className={linkClasses} onClick={() => setMobileOpen(false)}>
                  Sign Up as Restaurant
                </NavLink>
              </>
            )}

            {user && role === 'restaurant' && (
              <NavLink to="/post-shift" className={linkClasses} onClick={() => setMobileOpen(false)}>
                Post a Shift
              </NavLink>
            )}

            {user && (
              <>
                <NavLink
                  to={role === 'restaurant' ? '/dashboard/restaurant' : '/dashboard/worker'}
                  className={linkClasses}
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </NavLink>
                <div className="border-t border-border-subtle pt-4 mt-2">
                  <p className="text-sm text-text-muted mb-2">{displayName}</p>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-text-secondary hover:text-danger transition-colors cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
