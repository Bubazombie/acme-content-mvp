import React from "react";

export default function Page({ contentHtml }) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Welcome to Acme</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <main
          className="prose mx-auto max-w-3xl px-4 py-10"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </body>
    </html>
  );
}
