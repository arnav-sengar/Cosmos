
import Link from "next/link";

import styles from "./public-navigation.module.css";

const navigationItems = [
  { label: "Explore", href: "/explore" },
  { label: "Learn", href: "/learn" },
  { label: "Research", href: "/research" },
  { label: "Community", href: "/community" },
] as const;

export function PublicNavigation() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link
          href="/"
          className={styles.brand}
          aria-label="Cosmos home"
        >
          <span className={styles.brandMark} aria-hidden="true" />
          <span className={styles.brandName}>Cosmos</span>
        </Link>

        <nav
          className={styles.desktopNavigation}
          aria-label="Primary navigation"
        >
          <ul className={styles.navigationList}>
            {navigationItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={styles.navigationLink}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <details className={styles.mobileMenu}>
          <summary
            className={styles.menuTrigger}
            aria-label="Toggle navigation menu"
          >
            <span className={styles.menuLabel}>Menu</span>
            <span className={styles.menuIcon} aria-hidden="true">
              <span />
              <span />
            </span>
          </summary>

          <nav
            className={styles.mobilePanel}
            aria-label="Mobile navigation"
          >
            <ul className={styles.mobileNavigationList}>
              {navigationItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={styles.mobileNavigationLink}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
