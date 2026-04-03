import Image from 'next/image';
import styles from './landing.module.css';

export function SocialProof() {
  return (
    <div className={`${styles.glassCard} ${styles.socialProof}`}>
      <div className={styles.avatars}>
        <Image
          src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100"
          className={styles.avatar}
          alt="User"
          width={40}
          height={40}
        />
        <Image
          src="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100"
          className={styles.avatar}
          alt="User"
          width={40}
          height={40}
        />
        <Image
          src="https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100"
          className={styles.avatar}
          alt="User"
          width={40}
          height={40}
        />
        <div className={styles.avatarPlus}>+2k</div>
      </div>
      <div className={styles.socialStats}>
        <p className={styles.socialLabel}>Operators Active</p>
        <p className={styles.socialValue}>
          2,491 <span className={styles.onlineDot}>● Online</span>
        </p>
      </div>
    </div>
  );
}

