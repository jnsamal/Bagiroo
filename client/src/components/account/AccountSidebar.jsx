import { NavLink } from 'react-router-dom';

// Icon + label rows, matching the reference dashboard's structure while
// keeping Bagiroo's own flat, minimal styling (no card backgrounds, no
// rounded pills, no shadows -- just a thin active-state indicator).
const LINKS = [
  { to: '/account', label: 'Overview', icon: '\u2302', end: true },
  { to: '/account/orders', label: 'My Orders', icon: '\u{1F4E6}' },
  { to: '/account/addresses', label: 'Your Addresses', icon: '\u{1F4CD}' },
  { to: '/account/security', label: 'Login & Security', icon: '\u{1F512}' },
  { to: '/account/details', label: 'Account Details', icon: '\u{1F5C2}' },
  { to: '/account/wishlist', label: 'Saved Items', icon: '\u2661' },
  { to: '/account/support', label: 'Customer Support', icon: '\u{1F4AC}' },
];

export default function AccountSidebar() {
  return (
    <nav className="md:w-64 lg:w-72 shrink-0 border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-8 mb-10 md:mb-0">
      <ul className="grid grid-cols-2 gap-2 md:flex md:flex-col">
        {LINKS.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex h-full min-h-12 items-center gap-3 py-3 px-3 text-sm sm:text-base border-l-2 md:pl-4 md:-ml-4 ${
                  isActive ? 'border-ink font-medium' : 'border-transparent text-muted'
                }`
              }
            >
              <span aria-hidden className="w-5 text-lg text-center">{link.icon}</span>
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
