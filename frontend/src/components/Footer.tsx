import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-5 text-sm text-neutral-600 md:flex-row">
        <p>
          Built by <span className="font-semibold">Shivank Kumar</span>
        </p>

        <div className="flex items-center gap-5">
          <Link
            href="https://github.com/Shivankkumar09"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-black"
          >
            GitHub
          </Link>

          <Link
            href="https://www.linkedin.com/in/shivank-kumar-17a884254/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-blue-600"
          >
            LinkedIn
          </Link>
        </div>
      </div>
    </footer>
  );
}