import Providers from "@/providers/Provider";
import { ThemeProvider } from "@/theme";

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Providers>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </Providers>
    </>
  );
}