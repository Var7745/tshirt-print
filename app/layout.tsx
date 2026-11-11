import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import WhatsAppButton from '@/components/WhatsAppButton';

export const metadata: Metadata = {
  title: 'JK IMPRESS — Batch Photo T-Shirts & Custom Apparel | Make Your Mark',
  description:
    'Turn your graduation & college batch photos into luxury keepsake apparel worth keeping. Collect photos, choose collage layouts, and order together seamlessly without group-chat chaos.',
  keywords: ['JK IMPRESS', 'make your mark', 'batch photo t-shirts', 'college farewell tees', 'photo mosaic shirt', 'custom graduation apparel india'],
  icons: {
    icon: '/jk-impress-logo.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/jk-impress-logo.jpg" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1A1613]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <WhatsAppButton />
      </body>
    </html>
  );
}
