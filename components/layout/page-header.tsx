interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="shrink-0 border-b border-border bg-background">
      <div className="max-w-[1600px] mx-auto px-8 h-14 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold leading-none">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}
