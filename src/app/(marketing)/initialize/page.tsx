import Link from 'next/link';
import styles from './initialize.module.css';

export default function InitializePage() {
  return (
    <main className={styles.mainContent}>
      {/* Background Atmosphere */}
      <div className={styles.bgAtmosphere}>
        {/* Grid Pattern */}
        <div className={styles.gridPattern}></div>

        {/* Radial Glows */}
        <div className={styles.radialGlow1}></div>
        <div className={styles.radialGlow2}></div>

        {/* Noise Texture Overlay */}
        <div className={styles.noiseTexture}></div>
      </div>

      {/* Main Auth Container */}
      <div className={styles.containerAuth}>
        {/* Brand Header */}
        <div className={styles.headerBrand}>
          <Link href="/" className={styles.brandIcon}>
            <svg className={styles.icon} viewBox="0 0 512 512" fill="currentColor">
              <path d="M326.612 185.391c59.747 59.809 58.927 155.698.36 214.59-.11.12-.24.25-.36.37l-67.2 67.2c-59.27 59.27-155.699 59.262-214.96 0-59.27-59.26-59.27-155.7 0-214.96l37.106-37.106c9.84-9.84 26.786-3.3 27.294 10.606.648 17.722 3.826 35.527 9.69 52.721 1.986 5.822.567 12.262-3.783 16.612l-13.087 13.087c-28.026 28.026-28.905 73.66-1.155 101.96 28.024 28.579 74.086 28.749 102.325.51l67.2-67.19c28.191-28.191 28.073-73.757 0-101.83-3.701-3.694-7.429-6.564-10.341-8.569a16.037 16.037 0 0 1-6.947-12.606c-.396-10.567 3.348-21.456 11.698-29.806l21.054-21.055c5.521-5.521 14.182-6.199 20.584-1.731a152.482 152.482 0 0 1 20.522 17.197zM467.547 44.449c-59.261-59.262-155.69-59.27-214.96 0l-67.2 67.2c-.12.12-.25.25-.37.36-58.566 58.892-59.387 154.781.36 214.59a152.454 152.454 0 0 0 20.521 17.196c6.402 4.468 15.064 3.789 20.584-1.731l21.054-21.055c8.35-8.35 12.094-19.239 11.698-29.806a16.037 16.037 0 0 0-6.947-12.606c-2.912-2.005-6.64-4.875-10.341-8.569-28.073-28.073-28.191-73.639 0-101.83l67.2-67.19c28.239-28.239 74.3-28.069 102.325.51 27.75 28.3 26.872 73.934-1.155 101.96l-13.087 13.087c-4.35 4.35-5.769 10.79-3.783 16.612 5.864 17.194 9.042 34.999 9.69 52.721.509 13.906 17.454 20.446 27.294 10.606l37.106-37.106c59.271-59.259 59.271-155.699.001-214.959z" />
            </svg>
          </Link>
          <h1 className={styles.brandTitle}>Project 0.1</h1>
          <p className={styles.brandSubtitle}>v0.1.4-beta // System Access</p>
        </div>

        {/* Auth Card */}
        <div className={styles.cardAuthMain}>
          {/* Top Accent Line */}
          <div className={styles.accentLine}></div>

          {/* Tabs */}
          <div className={styles.sectionTabs}>
            <button className={`${styles.tab} ${styles.tabActive}`}>Sign In</button>
            <button className={styles.tab}>Sign Up</button>
          </div>

          {/* Form Content */}
          <div className={styles.formContent}>
            <form className={styles.formLogin}>
              {/* Email Field */}
              <div className={styles.fieldGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email Address
                </label>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputIconLeft}>
                    <svg className={styles.icon} viewBox="0 0 512 512" fill="currentColor">
                      <path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.4 40.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.6 152.4C504.9 141.3 512 127.1 512 112c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    className={styles.textInput}
                    placeholder="user@project01.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className={styles.fieldGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="password" className={styles.label}>
                    Password
                  </label>
                  <a href="#" className={styles.forgotLink}>
                    Forgot?
                  </a>
                </div>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputIconLeft}>
                    <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                      <path d="M144 144v48H304V144c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192V144C80 64.5 144.5 0 224 0s144 64.5 144 144v48h16c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64H80z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="password"
                    className={styles.textInput}
                    placeholder="••••••••••••"
                  />
                  <button type="button" className={styles.inputIconRightButton} aria-label="Toggle password visibility">
                    <svg className={styles.icon} viewBox="0 0 576 512" fill="currentColor">
                      <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.2-1.6-11.1 .3-14.5 4.8s-4.2 10.7-1.5 15.8c7.4 14.4 20.2 24.8 35.8 29.2c21.9 6.2 44.8 6.2 66.6 0c15.6-4.4 28.4-14.8 35.8-29.2c2.7-5.1 1.9-11.2-1.5-15.8s-9.3-6.4-14.5-4.8c-6.4 2.1-13.2 3.3-20.3 3.3c-35.3 0-64-28.7-64-64z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Link href="/signup" className={styles.btnSubmit}>
                <span>Authenticate</span>
                <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                  <path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z" />
                </svg>
              </Link>

              {/* Divider */}
              <div className={styles.divider}>
                <div className={styles.dividerLine}></div>
                <span className={styles.dividerText}>OR CONTINUE WITH</span>
                <div className={styles.dividerLine}></div>
              </div>

              {/* Social Auth */}
              <div className={styles.socialButtons}>
                <button type="button" className={styles.socialButton}>
                  <svg className={styles.icon} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span>GitHub</span>
                </button>
                <button type="button" className={styles.socialButton}>
                  <svg className={styles.icon} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Google</span>
                </button>
              </div>
            </form>
          </div>

          {/* Terminal Footer */}
          <div className={styles.cardFooter}>
            <div className={styles.footerStatus}>
              <div className={styles.statusDot}></div>
              <span className={styles.statusText}>System Operational</span>
            </div>
            <div className={styles.footerId}>
              ID: <span className={styles.footerIdValue}>8X-92</span>
            </div>
          </div>
        </div>

        {/* Bottom Links */}
        <div className={styles.footerLinks}>
          <p className={styles.footerText}>
            By continuing, you agree to Project 0.1&apos;s{' '}
            <a href="#" className={styles.footerLink}>
              Terms of Service
            </a>
            {' '}and{' '}
            <a href="#" className={styles.footerLink}>
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>

      {/* Decorative Abstract Elements */}
      <div className={styles.decoLeft}>
        <div className={styles.decoText}>
          <p>&gt; INITIATING SEQUENCE...</p>
          <p>&gt; LOADING ASSETS [OK]</p>
          <p>&gt; ESTABLISHING SECURE LINK...</p>
          <p className={styles.decoPulse}>&gt; WAITING FOR INPUT_</p>
        </div>
      </div>

      <div className={styles.decoRight}>
        <div className={styles.decoCircle1}></div>
        <div className={styles.decoCircle2}></div>
        <div className={styles.decoCircle3}></div>
      </div>
    </main>
  );
}
