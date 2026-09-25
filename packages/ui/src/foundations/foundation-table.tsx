import { useEffect, useState, type ReactNode } from "react";

export type Token = {
  name: string;
  variable: string;
};

const readCssVar = (variable: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(variable).trim();

export const useTokenValues = (tokens: Token[]) => {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    tokens.forEach((token) => {
      next[token.variable] = readCssVar(token.variable);
    });
    setValues(next);
  }, [tokens]);

  return values;
};

export const FoundationTable = ({
  tokens,
  renderPreview,
}: {
  tokens: Token[];
  renderPreview: (token: Token, value: string) => ReactNode;
}) => {
  const values = useTokenValues(tokens);

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: 8 }}>Token</th>
          <th style={{ textAlign: "left", padding: 8 }}>Value</th>
          <th style={{ textAlign: "left", padding: 8 }}>Preview</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((token) => {
          const value = values[token.variable] ?? "";
          return (
            <tr key={token.variable} style={{ borderTop: "1px solid #eee" }}>
              <td style={{ padding: 8, fontFamily: "monospace" }}>{token.name}</td>
              <td style={{ padding: 8, fontFamily: "monospace" }}>{value}</td>
              <td style={{ padding: 8 }}>{renderPreview(token, value)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
