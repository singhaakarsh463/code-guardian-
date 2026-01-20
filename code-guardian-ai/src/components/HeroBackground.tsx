export function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-accent/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-primary/10 rounded-full blur-[80px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
      
      {/* Floating code snippets */}
      <div className="absolute top-32 left-[10%] font-mono text-xs text-primary/20 animate-float">
        {'{ secure: true }'}
      </div>
      <div className="absolute top-48 right-[15%] font-mono text-xs text-primary/20 animate-float" style={{ animationDelay: '1s' }}>
        {'scan(code)'}
      </div>
      <div className="absolute bottom-32 left-[20%] font-mono text-xs text-primary/20 animate-float" style={{ animationDelay: '2s' }}>
        {'fix(vulnerability)'}
      </div>
    </div>
  );
}
