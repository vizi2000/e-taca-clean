'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function NotFound() {
  useEffect(() => {
    // Ensure proper 404 status code is set
    if (typeof window !== 'undefined') {
      document.title = '404 - Page Not Found | E-Taca';
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center px-4">
        <h1 className="text-9xl font-bold text-gray-800">404</h1>
        <h2 className="text-3xl font-semibold text-gray-600 mt-4">
          Strona nie została znaleziona
        </h2>
        <p className="text-gray-500 mt-2 mb-8">
          Przepraszamy, strona której szukasz nie istnieje.
        </p>
        <div className="space-x-4">
          <Link 
            href="/e-taca"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Wróć do strony głównej
          </Link>
          <Link 
            href="/e-taca/organizations"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Zobacz organizacje
          </Link>
        </div>
      </div>
    </div>
  );
}