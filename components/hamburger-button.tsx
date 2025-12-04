interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function HamburgerButton({ isOpen, onClick }: HamburgerButtonProps) {
  return (
    <button
      className="w-10 h-10 bg-dark-card border border-dark-border rounded-md cursor-pointer flex justify-center items-center p-0 shadow-lg transition-all duration-300 hover:bg-dark-gray hover:border-brand-green hover:shadow-xl relative z-[101]"
      onClick={onClick}
      aria-label="메뉴 열기/닫기"
    >
      <span className="material-icons text-2xl text-dark-text transition-colors duration-300 select-none">
        {isOpen ? 'close' : 'menu'}
      </span>
    </button>
  );
}

