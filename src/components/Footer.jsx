import React from "react";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 w-full py-3 px-8 text-xs text-gray-400 text-center space-y-0.5 bg-white/80 backdrop-blur-sm">
      <p>© {new Date().getFullYear()} Wu et al., Carnegie Mellon University. <a href="https://arxiv.org/abs/2505.10300" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">arXiv:2505.10300</a>.</p>
      <p>"AI LEGO" is not affiliated with or endorsed by the LEGO Group.</p>
    </footer>
  );
}
