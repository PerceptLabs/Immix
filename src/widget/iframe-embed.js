/**
 * Immix Iframe Embed Script
 * This script creates an iframe-based embedding solution for the Immix widget
 * Provides better security isolation and cross-domain compatibility
 */

(function() {
  'use strict';

  // Default configuration
  const DEFAULT_CONFIG = {
    mode: 'embedded',
    theme: 'light',
    position: 'bottom-right',
    width: '400px',
    height: '600px',
    enableCitations: true,
    enableFeedback: true,
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    zIndex: 9999,
    // Default iframe source (should be updated to your deployment URL)
    iframeSrc: 'https://your-domain.com/widget/',
  };

  class ImmixIframeWidget {
    constructor(config) {
      // API key no longer required - handled by server
      
      if (!config.agentId) {
        throw new Error('Immix: Agent ID is required');
      }

      this.config = { ...DEFAULT_CONFIG, ...config };
      this.iframe = null;
      this.container = null;
      this.isOpen = false;
      this.isInitialized = false;
      
      this.init();
    }

    init() {
      this.createContainer();
      this.createIframe();
      this.setupMessageHandling();
      this.setupStyles();
      
      if (this.config.mode === 'floating') {
        this.createFloatingButton();
      } else if (this.config.mode === 'embedded') {
        this.open();
      }

      this.isInitialized = true;
    }

    createContainer() {
      const { mode, containerId } = this.config;

      if (mode === 'embedded' && containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
          throw new Error(`Immix: Container with id "${containerId}" not found`);
        }
      } else {
        this.container = document.createElement('div');
        this.container.id = 'immix-iframe-container';
        
        if (mode === 'floating') {
          this.setupFloatingStyles();
          document.body.appendChild(this.container);
        } else {
          document.body.appendChild(this.container);
        }
      }
    }

    createIframe() {
      this.iframe = document.createElement('iframe');
      
      // Build iframe source URL with configuration
      const params = new URLSearchParams({
        agentId: this.config.agentId.toString(),
        mode: this.config.mode,
        theme: this.config.theme,
        enableCitations: this.config.enableCitations,
        enableFeedback: this.config.enableFeedback,
        embedded: 'true'
      });

      this.iframe.src = `${this.config.iframeSrc}?${params.toString()}`;
      this.iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        border-radius: ${this.config.borderRadius};
        background: white;
      `;
      
      // Security attributes
      this.iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
      this.iframe.setAttribute('allow', 'clipboard-read; clipboard-write');
      this.iframe.setAttribute('loading', 'lazy');
      
      this.container.appendChild(this.iframe);
    }

    setupFloatingStyles() {
      const { position, width, height, zIndex, boxShadow } = this.config;
      
      Object.assign(this.container.style, {
        position: 'fixed',
        zIndex: zIndex.toString(),
        width,
        height,
        boxShadow,
        borderRadius: this.config.borderRadius,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'translateY(20px)',
        opacity: '0',
        pointerEvents: 'none',
      });

      // Position-specific styles
      const positions = {
        'bottom-right': { bottom: '20px', right: '20px' },
        'bottom-left': { bottom: '20px', left: '20px' },
        'top-right': { top: '20px', right: '20px' },
        'top-left': { top: '20px', left: '20px' },
      };

      Object.assign(this.container.style, positions[position] || positions['bottom-right']);
    }

    createFloatingButton() {
      const button = document.createElement('button');
      button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C10.3596 21.9996 8.74496 21.6312 7.29496 20.926L2.58496 22.294C2.24496 22.382 1.92496 22.114 2.01296 21.774L3.38096 17.064C2.67565 15.6140 2.30721 14.0003 2.30721 12.3889C2.30721 6.86611 6.77832 2.39501 12.301 2.39501L12 2Z" fill="currentColor"/>
        </svg>
      `;
      
      Object.assign(button.style, {
        position: 'fixed',
        [this.config.position.includes('right') ? 'right' : 'left']: '20px',
        [this.config.position.includes('bottom') ? 'bottom' : 'top']: '20px',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        border: 'none',
        background: '#007acc',
        color: 'white',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 122, 204, 0.4)',
        zIndex: (this.config.zIndex + 1).toString(),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        outline: 'none',
      });

      // Hover effects
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1)';
        button.style.boxShadow = '0 6px 16px rgba(0, 122, 204, 0.6)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 4px 12px rgba(0, 122, 204, 0.4)';
      });

      button.addEventListener('click', () => {
        this.toggle();
      });

      document.body.appendChild(button);
      this.floatingButton = button;
    }

    setupMessageHandling() {
      window.addEventListener('message', (event) => {
        // Security: Verify origin if needed
        // if (event.origin !== 'https://your-domain.com') return;

        const { type, data } = event.data;

        switch (type) {
          case 'immix-ready':
            this.onReady();
            break;
          case 'immix-resize':
            this.onResize(data);
            break;
          case 'immix-message':
            this.onMessage(data);
            break;
          case 'immix-close':
            this.close();
            break;
          case 'immix-error':
            this.onError(data);
            break;
        }
      });
    }

    setupStyles() {
      if (this.config.mode === 'embedded') {
        Object.assign(this.container.style, {
          width: '100%',
          height: this.config.height,
          borderRadius: this.config.borderRadius,
          overflow: 'hidden',
        });
      }
    }

    // Event handlers
    onReady() {
      if (this.config.onReady) {
        this.config.onReady();
      }
    }

    onMessage(data) {
      if (this.config.onMessage) {
        this.config.onMessage(data);
      }
    }

    onResize(dimensions) {
      if (this.config.mode === 'embedded' && dimensions) {
        this.container.style.height = `${dimensions.height}px`;
      }
    }

    onError(error) {
      console.error('Immix Widget Error:', error);
      if (this.config.onError) {
        this.config.onError(error);
      }
    }

    // Public API methods
    open() {
      if (!this.isInitialized) return;

      this.isOpen = true;
      
      if (this.config.mode === 'floating') {
        this.container.style.display = 'block';
        this.container.style.pointerEvents = 'auto';
        
        // Animate in
        requestAnimationFrame(() => {
          this.container.style.transform = 'translateY(0)';
          this.container.style.opacity = '1';
        });

        if (this.floatingButton) {
          this.floatingButton.style.display = 'none';
        }
      }

      // Send message to iframe
      this.postMessage('open');

      if (this.config.onOpen) {
        this.config.onOpen();
      }
    }

    close() {
      if (!this.isInitialized) return;

      this.isOpen = false;

      if (this.config.mode === 'floating') {
        this.container.style.transform = 'translateY(20px)';
        this.container.style.opacity = '0';
        
        setTimeout(() => {
          this.container.style.display = 'none';
          this.container.style.pointerEvents = 'none';
        }, 300);

        if (this.floatingButton) {
          this.floatingButton.style.display = 'flex';
        }
      }

      // Send message to iframe
      this.postMessage('close');

      if (this.config.onClose) {
        this.config.onClose();
      }
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    destroy() {
      if (this.iframe && this.iframe.parentNode) {
        this.iframe.parentNode.removeChild(this.iframe);
      }
      
      if (this.container && this.container.parentNode && this.config.mode !== 'embedded') {
        this.container.parentNode.removeChild(this.container);
      }

      if (this.floatingButton && this.floatingButton.parentNode) {
        this.floatingButton.parentNode.removeChild(this.floatingButton);
      }

      this.iframe = null;
      this.container = null;
      this.floatingButton = null;
      this.isInitialized = false;
    }

    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
      
      // Rebuild iframe with new config
      const oldIframe = this.iframe;
      this.createIframe();
      
      if (oldIframe && oldIframe.parentNode) {
        oldIframe.parentNode.removeChild(oldIframe);
      }
    }

    postMessage(type, data = {}) {
      if (this.iframe && this.iframe.contentWindow) {
        this.iframe.contentWindow.postMessage({
          type: `immix-${type}`,
          data
        }, '*');
      }
    }

    // Getters
    get isOpened() {
      return this.isOpen;
    }

    get configuration() {
      return { ...this.config };
    }
  }

  // Global API
  const ImmixEmbed = {
    init: function(config) {
      return new ImmixIframeWidget(config);
    },

    create: function(config) {
      return new ImmixIframeWidget(config);
    }
  };

  // Export for different environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImmixEmbed;
  } else if (typeof define === 'function' && define.amd) {
    define([], function() {
      return ImmixEmbed;
    });
  } else {
    window.ImmixEmbed = ImmixEmbed;
  }

})();