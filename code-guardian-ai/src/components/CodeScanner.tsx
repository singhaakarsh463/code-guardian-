import { useEffect, useState } from "react";

const vulnerableCode = `function login(username, password) {
  // SQL Injection vulnerability
  const query = "SELECT * FROM users 
    WHERE username='" + username + "'";
  
  // Hardcoded credentials
  if (password === "admin123") {
    return { admin: true };
  }
  
  // XSS vulnerability
  document.innerHTML = username;
  
  return db.execute(query);
}`;

const fixedCode = `function login(username, password) {
  // ✓ Parameterized query
  const query = db.prepare(
    "SELECT * FROM users WHERE username = ?"
  );
  
  // ✓ Secure password check
  const isValid = await bcrypt.compare(
    password, user.hashedPassword
  );
  
  // ✓ Sanitized output
  element.textContent = sanitize(username);
  
  return query.execute([username]);
}`;

const vulnerabilities = [
  { line: 3, type: "SQL Injection", severity: "critical" },
  { line: 6, type: "Hardcoded Credentials", severity: "high" },
  { line: 10, type: "XSS Vulnerability", severity: "high" },
];

export function CodeScanner() {
  const [scanProgress, setScanProgress] = useState(0);
  const [currentVuln, setCurrentVuln] = useState(0);
  const [isScanning, setIsScanning] = useState(true);
  const [showFixed, setShowFixed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          setIsScanning(false);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isScanning && currentVuln < vulnerabilities.length) {
      const timeout = setTimeout(() => {
        setCurrentVuln((prev) => prev + 1);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [isScanning, currentVuln]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-destructive bg-destructive/10 border-destructive/30";
      case "high":
        return "text-warning bg-warning/10 border-warning/30";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Vulnerable Code */}
      <div className="code-block overflow-hidden">
        <div className="terminal-header">
          <div className="terminal-dot bg-destructive" />
          <div className="terminal-dot bg-warning" />
          <div className="terminal-dot bg-success" />
          <span className="ml-2 text-xs text-muted-foreground">
            vulnerable.js
          </span>
          {isScanning && (
            <span className="ml-auto text-xs text-primary animate-pulse">
              Scanning... {scanProgress}%
            </span>
          )}
        </div>
        <div className="relative p-4 overflow-x-auto">
          {isScanning && (
            <div
              className="absolute left-0 right-0 h-6 scan-line pointer-events-none z-10"
              style={{ top: `${(scanProgress / 100) * 280}px` }}
            />
          )}
          <pre className="text-sm leading-relaxed">
            {vulnerableCode.split("\n").map((line, i) => {
              const vuln = vulnerabilities.find((v) => v.line === i + 1);
              const isHighlighted =
                vuln && currentVuln >= vulnerabilities.indexOf(vuln) + 1;
              return (
                <div
                  key={i}
                  className={`flex gap-4 ${
                    isHighlighted ? "bg-destructive/10 -mx-4 px-4" : ""
                  }`}
                >
                  <span className="text-muted-foreground/50 select-none w-4">
                    {i + 1}
                  </span>
                  <code className="text-muted-foreground">{line}</code>
                </div>
              );
            })}
          </pre>
        </div>
      </div>

      {/* Fixed Code / Vulnerabilities */}
      <div className="space-y-4">
        {/* Vulnerability List */}
        <div className="space-y-3">
          {vulnerabilities.map((vuln, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg border transition-all duration-500 ${
                currentVuln > i
                  ? getSeverityColor(vuln.severity)
                  : "bg-muted/20 border-border opacity-40"
              }`}
              style={{
                transform: currentVuln > i ? "translateX(0)" : "translateX(20px)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs">Line {vuln.line}</span>
                  <span className="font-medium">{vuln.type}</span>
                </div>
                <span
                  className={`text-xs font-semibold uppercase px-2 py-1 rounded ${
                    vuln.severity === "critical"
                      ? "bg-destructive/20"
                      : "bg-warning/20"
                  }`}
                >
                  {vuln.severity}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Toggle Fixed Code */}
        {currentVuln >= vulnerabilities.length && (
          <button
            onClick={() => setShowFixed(!showFixed)}
            className="w-full p-3 rounded-lg border border-success/30 bg-success/10 text-success font-medium transition-all hover:bg-success/20"
          >
            {showFixed ? "Hide" : "Show"} AI-Generated Fix →
          </button>
        )}

        {showFixed && (
          <div className="code-block overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="terminal-header">
              <div className="terminal-dot bg-success" />
              <div className="terminal-dot bg-success" />
              <div className="terminal-dot bg-success" />
              <span className="ml-2 text-xs text-success">fixed.js ✓</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <pre className="text-sm leading-relaxed">
                {fixedCode.split("\n").map((line, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-muted-foreground/50 select-none w-4">
                      {i + 1}
                    </span>
                    <code className="text-success/80">{line}</code>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
