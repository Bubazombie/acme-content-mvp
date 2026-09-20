import React from "react";

export default function Page({ contentHtml }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Welcome to Acme</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body className="min-h-screen bg-[#EEF1F4]">
        <header className="bg-[#1c2b45] px-6 py-5">
          <div className="mx-auto max-w-2xl text-lg font-semibold tracking-tight text-white">
            Acme Co.
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-6 py-12">
          <div
            className="prose rounded-lg border border-slate-200 bg-white px-8 py-10 shadow-sm"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </main>
      </body>
    </html>
  );
}
