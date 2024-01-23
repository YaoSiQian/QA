import Github from "./icons/Github";

export default () => (
  <footer class="mt-6 text-sm text-slate-800 op-60">
    <div class="flex" mt-3 gap-2>
      <a
        class="flex max-w-fit items-center justify-center space-x-2 rounded-1 border border-amber-300 bg-amber px-3 py-2 text-sm text-gray-600 shadow-sm transition-colors hover:border-amber-400 hover:bg-amber-300 hover:text-slate-2"
        href="https://www.yaosiqian.cn"
        target="_blank"
        rel="noopener noreferrer">
        <svg
          stroke="currentColor"
          fill="currentColor"
          stroke-width="0"
          viewBox="0 0 512 512"
          class="text-[#e53e3e]"
          height="18"
          width="18"
          xmlns="http://www.w3.org/2000/svg">
          <path d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z"></path>
        </svg>
        <span text-slate-800>感谢支持</span>
      </a>
      <a
        class="flex max-w-fit items-center justify-center space-x-2 rounded-1 border border-gray-300 bg-gray-3 px-3 py-2 text-sm text-gray-600 shadow-sm transition-colors hover:border-gray-500 hover:bg-gray-6 hover:text-slate-2"
        href="https://github.com/YaoSiQian"
        target="_blank"
        rel="noopener noreferrer">
        <Github />
        <span>GitHub</span>
      </a>
      <a
        class="flex max-w-fit items-center justify-center space-x-2 rounded-1 border border-sky-300 bg-sky px-3 py-2 text-sm text-gray-600 shadow-sm transition-colors hover:border-sky-400 hover:bg-sky-300 hover:text-slate-2"
        href="https://b23.tv/BV1qg4y127ep"
        target="_blank"
        rel="noopener noreferrer">
        <svg
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="1482"
          width="18" height="18">
          <path d="M512 78.8c-239.3 0-433.2 194-433.2 433.2 0 239.3 194 433.2 433.2 433.2 239.3 0 433.2-194 433.2-433.2 0.1-239.2-193.9-433.2-433.2-433.2z m183.3 447.9L455.1 720c-12.3 9.9-30.5 1.1-30.5-14.6V318.7c0-15.7 18.2-24.5 30.5-14.6l240.2 193.4c9.4 7.5 9.4 21.7 0 29.2z" fill="#ffffff" p-id="1483"></path>
        </svg>
        <span text-slate-800>演示视频</span>
      </a>
    </div>
  </footer>
);
