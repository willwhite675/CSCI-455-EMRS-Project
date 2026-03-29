"use strict";
class Router {
    contentContainer = null;
    constructor() {
        this.contentContainer = document.querySelector('.container');
        this.initNavigationHandlers();
    }
    initNavigationHandlers() {
        // Intercept all clicks on navigation links
        document.addEventListener('click', (e) => {
            const target = e.target;
            const link = target.closest('a[href]');
            if (link && link.id === 'logout') {
                return;
            }
            if (link && this.isInternalLink(link)) {
                e.preventDefault();
                const url = link.getAttribute('href');
                if (url) {
                    this.navigate(url);
                }
            }
        });
        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.loadPage(window.location.pathname, false);
        });
    }
    isInternalLink(link) {
        const href = link.getAttribute('href') || '';
        return href.includes('.html') &&
            !href.includes('login.html') &&
            !link.href.startsWith('http://') &&
            !link.href.startsWith('https://');
    }
    async navigate(url) {
        history.pushState({}, '', url);
        await this.loadPage(url, true);
    }
    async loadPage(url, addTransition) {
        if (!this.contentContainer)
            return;
        // Add fade-out effect
        if (addTransition) {
            this.contentContainer.style.transition = 'opacity 0.2s ease-in-out';
            this.contentContainer.style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        try {
            const response = await fetch(url);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newContent = doc.querySelector('.container');
            if (newContent && this.contentContainer) {
                // Update content
                this.contentContainer.innerHTML = newContent.innerHTML;
                // Fade in
                this.contentContainer.style.opacity = '1';
            }
            // Update page title
            const newTitle = doc.querySelector('title')?.textContent;
            if (newTitle) {
                document.title = newTitle;
            }
            await this.loadPageScript(url);
        }
        catch (error) {
            console.error('Navigation error:', error);
            window.location.href = url;
        }
    }
    async loadPageScript(url) {
        // Extract the page name from URL (e.g., "patients" from "../patients/patients.html")
        const match = url.match(/\/([^\/]+)\/\1\.html$/);
        if (match) {
            const pageName = match[1];
            const scriptUrl = `../${pageName}/${pageName}.js`;
            // Remove old page scripts
            const oldScripts = document.querySelectorAll('script[data-page-script]');
            oldScripts.forEach(script => script.remove());
            // Load new script
            const script = document.createElement('script');
            script.src = scriptUrl;
            script.setAttribute('data-page-script', 'true');
            document.body.appendChild(script);
        }
    }
}
let router = null;
function initRouter() {
    if (!router) {
        router = new Router();
    }
}
