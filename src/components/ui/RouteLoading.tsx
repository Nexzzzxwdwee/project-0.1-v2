import styles from './route-loading.module.css';

interface RouteLoadingProps {
  cardCount?: number;
  listCount?: number;
}

export default function RouteLoading({ cardCount = 3, listCount = 6 }: RouteLoadingProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={`${styles.skeleton} ${styles.title}`}></div>
        <div className={`${styles.skeleton} ${styles.subtitle}`}></div>
      </div>
      {cardCount > 0 && (
        <div className={styles.cards}>
          {Array.from({ length: cardCount }).map((_, index) => (
            <div key={`card-${index}`} className={`${styles.skeleton} ${styles.card}`}></div>
          ))}
        </div>
      )}
      {listCount > 0 && (
        <div className={styles.list}>
          {Array.from({ length: listCount }).map((_, index) => (
            <div key={`row-${index}`} className={`${styles.skeleton} ${styles.row}`}></div>
          ))}
        </div>
      )}
    </div>
  );
}
