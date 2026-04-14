interface PageBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function PageBody({ children, className }: PageBodyProps) {
  return (
    <div className="flex-1 overflow-auto">
      <div className={`max-w-[1600px] mx-auto px-8 py-4 ${className ?? ""}`}>
        {children}
      </div>
    </div>
  );
}
