import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/components/ReduxProvider";
import ClientThemeProvider from "@/components/ClientThemeProvider";
import AuthBootstrap from "@/components/AuthBootstrap";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Social Media App",
  description: "A simple social media platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ReduxProvider>
          <ClientThemeProvider>
            <AuthBootstrap />
            {children}
          </ClientThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
