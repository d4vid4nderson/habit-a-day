'use client';

export function Footer() {
  return (
    <footer className="pt-6">
      <div className="border-t border-zinc-200 dark:border-zinc-700" />
      <div className="py-6 text-sm">
        <h3 className="font-semibold text-purple-600 dark:text-purple-400">Potty Logger</h3>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Simple bathroom tracking for health and wellness.
        </p>
        <p className="mt-3 text-zinc-400 dark:text-zinc-500">
          © 2026 Built with 💩 by David Anderson.
        </p>
        <p className="text-zinc-400 dark:text-zinc-500">
          All rights reserved. Version 1.0
        </p>
      </div>
    </footer>
  );
}
