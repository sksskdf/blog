import styles from './hamburger-button.module.css';

interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function HamburgerButton({ isOpen, onClick }: HamburgerButtonProps) {
  return (
    <button
      className={styles.hamburger}
      onClick={onClick}
      aria-label="메뉴 열기/닫기"
    >
      {isOpen ? (
        <span className="material-icons">close</span>
      ) : (
        <span className="material-icons">menu</span>
      )}
    </button>
  );
}

