import Link from 'next/link'
import { MenuIcon } from '@/components/invitation/MenuIcon'
import { menuItems } from '@/components/invitation/menu-items'

export function MenuGrid() {
  return (
    <nav aria-label="Menu do convite" className="w-full px-4 pb-16">
      {/*
        `basis-1/3` with no column gap gives exactly three per row; the spacing
        between them is padding inside each item, so the thirds always add up
        to 100%. `justify-center` is what centres the last row, which holds two
        items rather than three.
      */}
      <ul className="flex flex-wrap justify-center gap-y-7">
        {menuItems.map((item, index) => (
          <li
            key={item.href}
            // A CSS animation, not `motion`: it plays from the server HTML, so
            // the menu shows on first paint instead of sitting at opacity 0
            // until the JavaScript arrives.
            style={{ animationDelay: `${index * 80}ms` }}
            className="flex basis-1/3 justify-center px-1 motion-safe:animate-fade-up"
          >
            <Link
              href={item.href}
              className="group flex w-full flex-col items-center gap-3 rounded-2xl py-1 text-center"
            >
              <span
                aria-hidden
                className="flex h-20 w-20 items-center justify-center rounded-full border border-accent/40 bg-surface/70 bg-[radial-gradient(circle_at_50%_28%,rgba(232,199,102,0.18),transparent_62%)] text-accent-light shadow-lg shadow-black/40 transition-colors group-hover:border-accent group-hover:bg-surface"
              >
                <MenuIcon name={item.icon} />
              </span>
              <span className="font-sans text-[11px] uppercase leading-tight tracking-[0.12em] text-foreground/85 transition-colors group-hover:text-accent-light">
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
