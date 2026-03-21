import React from 'react';

export default function Footer() {
  return (
    <footer className="fixed bottom-0 right-0 h-12 bg-white border-t flex items-center justify-center w-full">
      <p className="text-sm text-gray-600">
        © {new Date().getFullYear()} SWAASTHYA. All rights reserved.
      </p>
    </footer>
  );
}