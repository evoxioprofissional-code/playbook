export default function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-ink-700 px-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-flame-400">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
}
