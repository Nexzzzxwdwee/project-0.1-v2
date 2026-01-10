import Link from 'next/link';
import styles from '@/components/komposo/landing/landing.module.css';

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      {/* Ambient Background */}
      <div className={styles.ambientBg}>
        <div className={`${styles.gridBg} ${styles.ambientGrid}`}></div>
        <div className={styles.ambientGlow1}></div>
        <div className={styles.ambientGlow2}></div>
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logoIcon}>
            <svg className={styles.icon} viewBox="0 0 512 512" fill="currentColor" style={{ color: '#22c55e', fontSize: '0.875rem' }}>
              <path d="M326.612 185.391c59.747 59.809 58.927 155.698.36 214.59-.11.12-.24.25-.36.37l-67.2 67.2c-59.27 59.27-155.699 59.262-214.96 0-59.27-59.26-59.27-155.7 0-214.96l37.106-37.106c9.84-9.84 26.786-3.3 27.294 10.606.648 17.722 3.826 35.527 9.69 52.721 1.986 5.822.567 12.262-3.783 16.612l-13.087 13.087c-28.026 28.026-28.905 73.66-1.155 101.96 28.024 28.579 74.086 28.749 102.325.51l67.2-67.19c28.191-28.191 28.073-73.757 0-101.83-3.701-3.694-7.429-6.564-10.341-8.569a16.037 16.037 0 0 1-6.947-12.606c-.396-10.567 3.348-21.456 11.698-29.806l21.054-21.055c5.521-5.521 14.182-6.199 20.584-1.731a152.482 152.482 0 0 1 20.522 17.197zM467.547 44.449c-59.261-59.262-155.69-59.27-214.96 0l-67.2 67.2c-.12.12-.25.25-.37.36-58.566 58.892-59.387 154.781.36 214.59a152.454 152.454 0 0 0 20.521 17.196c6.402 4.468 15.064 3.789 20.584-1.731l21.054-21.055c8.35-8.35 12.094-19.239 11.698-29.806a16.037 16.037 0 0 0-6.947-12.606c-2.912-2.005-6.64-4.875-10.341-8.569-28.073-28.073-28.191-73.639 0-101.83l67.2-67.19c28.239-28.239 74.3-28.069 102.325.51 27.75 28.3 26.872 73.934-1.155 101.96l-13.087 13.087c-4.35 4.35-5.769 10.79-3.783 16.612 5.864 17.194 9.042 34.999 9.69 52.721.509 13.906 17.454 20.446 27.294 10.606l37.106-37.106c59.271-59.259 59.271-155.699.001-214.959z" />
            </svg>
          </div>
          <span className={styles.logoText}>Project 0.1</span>
        </div>
        <div className={styles.statusBadge}>
          <span className={styles.pingDot}>
            <span className={styles.pingDotRing}></span>
            <span className={styles.pingDotInner}></span>
          </span>
          <span className={`${styles.statusText} ${styles.fontMono}`}>System Online v2.4</span>
        </div>
        <Link href="/signup" className={styles.loginButton}>
          Login
        </Link>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Hero Text */}
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>
            EXECUTE.<br />
            <span className={styles.gradientText}>RANK UP.</span>
            <br />
            DOMINATE.
          </h1>

          <p className={styles.heroSubtitle}>
            The operating system for the 0.1%. Gamify your discipline, track protocols, and visualize your evolution.
          </p>
        </div>

        {/* Visual Hook: Floating Rank Card */}
        <div className={styles.rankCardWrapper}>
          <div className={styles.rankCardGlow}></div>
          <div className={`${styles.glassCard} ${styles.rankCard} ${styles.animateFloat}`}>
            <div className={styles.rankCardInner}>
              <div className={styles.scanLine}></div>
            </div>

            <div className={styles.cardHeader}>
              <div>
                <p className={`${styles.cardStatus} ${styles.fontMono}`}>Current Status</p>
                <h3 className={styles.cardTitle}>
                  OPERATOR
                  <svg className={styles.icon} viewBox="0 0 512 512" fill="currentColor" style={{ color: '#22c55e', fontSize: '0.75rem' }}>
                    <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
                  </svg>
                </h3>
              </div>
              <div className={styles.crownIcon}>
                <svg className={styles.icon} viewBox="0 0 576 512" fill="currentColor" style={{ color: 'white', fontSize: '1.125rem' }}>
                  <path d="M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6H426.6c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z" />
                </svg>
              </div>
            </div>

            <div className={styles.cardStats}>
              <div className={styles.statRow}>
                <span className={`${styles.statLabel} ${styles.fontMono}`}>XP Progress</span>
                <span className={`${styles.statValue} ${styles.fontMono}`}>1,240 / 1,500</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill}></div>
              </div>
              <div className={styles.statBadges}>
                <div className={`${styles.statBadge} ${styles.fontMono}`}>🔥 12 Day Streak</div>
                <div className={`${styles.statBadge} ${styles.fontMono}`}>✅ 94% Efficiency</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className={styles.featuresGrid}>
          <div className={`${styles.glassCard} ${styles.featureCard}`}>
            <div className={`${styles.featureIcon} ${styles.featureIconGreen}`}>
              <svg className={styles.icon} viewBox="0 0 512 512" fill="currentColor">
                <path d="M152.1 38.2c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 113C-2.3 103.6-2.3 88.4 7 79s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zm0 160c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 273c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zM224 96c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H256c-17.7 0-32-14.3-32-32zm0 160c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H256c-17.7 0-32-14.3-32-32zM160 416c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H192c-17.7 0-32-14.3-32-32zM48 368a48 48 0 1 1 0 96 48 48 0 1 1 0-96z" />
              </svg>
            </div>
            <div>
              <h4 className={styles.featureTitle}>Tactical Habits</h4>
              <p className={styles.featureDescription}>Build protocols. Check off daily missions. Maintain the streak to survive.</p>
            </div>
          </div>

          <div className={`${styles.glassCard} ${styles.featureCard}`}>
            <div className={`${styles.featureIcon} ${styles.featureIconYellow}`}>
              <svg className={styles.icon} viewBox="0 0 576 512" fill="currentColor">
                <path d="M400 0H176c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8H24C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9H192c-17.7 0-32 14.3-32 32s14.3 32 32 32H384c17.7 0 32-14.3 32-32s-14.3-32-32-32H357.9C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24H446.4c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112h84.4c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6h84.4c-5.1 66.3-31.1 111.2-63 142.3z" />
              </svg>
            </div>
            <div>
              <h4 className={styles.featureTitle}>Rank System</h4>
              <p className={styles.featureDescription}>Earn XP for consistency. Climb from Recruit to Elite Operator status.</p>
            </div>
          </div>

          <div className={`${styles.glassCard} ${styles.featureCard}`}>
            <div className={`${styles.featureIcon} ${styles.featureIconBlue}`}>
              <svg className={styles.icon} viewBox="0 0 512 512" fill="currentColor">
                <path d="M64 64c0-17.7-14.3-32-32-32S0 46.3 0 64V400c0 44.2 35.8 80 80 80H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H80c-8.8 0-16-7.2-16-16V64zm406.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L320 210.7l-57.4-57.4c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L240 221.3l57.4 57.4c12.5 12.5 32.8 12.5 45.3 0l128-128z" />
              </svg>
            </div>
            <div>
              <h4 className={styles.featureTitle}>Data Analytics</h4>
              <p className={styles.featureDescription}>Visualize your performance. Identify weak points. Optimize your life.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom CTA Section */}
      <div className={styles.ctaSection}>
        <div className={styles.ctaContainer}>
          <Link href="/initialize" className={styles.ctaButton}>
            <span>INITIALIZE PROTOCOL</span>
            <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
              <path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z" />
            </svg>
          </Link>

          <p className={`${styles.ctaFooter} ${styles.fontMono}`}>
            By joining, you accept the <a href="#">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
}
