(function () {

  const ENV = window.location.hostname === "localhost" || "127.0.0.1" ? "development" : "production";
  const config = window.kwixiConfig || {};
  const clientId = config.clientId;

  console.log('ENV:', ENV)

  const CONFIG = {
    chatbotSrc: ENV === "development"
      ? `http://localhost:3004/client/${clientId}/` // or your local chatbot URL
      : `https://kwixi.ai/client/${clientId}/`,
    iframeOrigin: ENV === "development"
      ? "http://localhost:3004"
      : "https://kwixi.ai"
  };
  

  console.log('Script loaded!');



  if (!clientId) {
    console.log('Client Id not found');
    return;
  }

  var container = document.getElementById("chatbot-container");
  if (container) {
    console.log('Chatbot container found', container);
    // Set initial chatbot-container styles
    container.style.position = 'fixed';
    container.style.right = '0px';
    container.style.overflow = 'hidden';
  } else {
    console.log('Chatbot container not found.');
  }

  // const chatbotSrc = `https://kwixi.ai/client/${clientId}/`
  const chatbotSrc = CONFIG.chatbotSrc;
  container.innerHTML = `
    <iframe id="chatbot-iframe"
      src=${chatbotSrc}
      style="width: 100%; height: 100%; border: none;"
      scrolling="no">
    </iframe>
  `;

  function isMobileDevice() {
    return window.innerWidth <= 768;
  };

  function sendMobileStatusToIframe(status) {
    const iframe = document.getElementById('chatbot-iframe');
    // iframe.contentWindow.postMessage({ action: 'isMobileResponse', isMobile: window.isMobile }, `https://kwixi.ai/client/${clientId}/`);
    iframe.contentWindow.postMessage({ action: 'isMobileStatus', isMobile: status }, CONFIG.iframeOrigin);
  }

  function updateMobileStatus() {
    const isMobile = isMobileDevice();

    if (isMobile !== window.isMobile) {
      console.log('Mobile status has changed:', isMobile);
      sendMobileStatusToIframe(isMobile);
    }
    window.isMobile = isMobile;
  }

  function openOrCloseChatbot(action) {
    // action = 'openChat' or 'closeChat' 
    const iframe = document.getElementById('chatbot-iframe');

    iframe.contentWindow.postMessage({ action: action }, CONFIG.iframeOrigin);
  }

  // function getThemeColor() {
  //   if (document.querySelector('meta[name=theme-color]')) {
  //     var themeColorMeta = document.querySelector('meta[name=theme-color]');
  //     const themeColor = themeColorMeta.content;
  //     return themeColor;
  //   } else { return null };
  // };


  // EVENT LISTENERS START ----------------------------------------------------
  // Resize
  window.addEventListener('resize', () => {
    updateMobileStatus();
  });

  // Load
  window.addEventListener('load', () => {
    const container = document.getElementById('chatbot-container');
    container.style.width = '82px';
    container.style.height = '82px';
    updateMobileStatus();
  });

  // Calendly
  window.addEventListener("message", function(e) {
    if(isCalendlyEvent(e)) {
      if(e.data.event === "calendly.event_scheduled") {
        sendDataToChatbot({ action: 'storeMeeting', meetingDetails: e.data.payload }) 
      }
    }});
  // document.getElementById('calendly-close').addEventListener('click', function() {
  //   closeCalendlyModal()
  // })

  // EVENT LISTENERS END ---------------------------------------------------------


  // SCHEDULER FUNCITONS START -------------------------------------------------
  function openScheduler(schedulerData) {
    console.log('Scheduler data:', schedulerData);

    const { type, url } = schedulerData;

    switch (type) {
      case 'calendly':
        injectCalendlyScript();
        injectCalendlyDom();
        // addCalendlyStyles();
        updateCalendlyStyles();
        openCalendlyModal(url);
        break;
      
      case 'google':
        openBookingLink(url);
        break;
      
      case 'zoom':
        openBookingLink(url);
        break;

      case 'autoOps':
        openAutoOps();
        break;
      
      case 'custom':
        openBookingLink(url);
        break;
      
      default:
        console.warn('Unknown scheduler type:', type);
        break;
    }

  }

  function injectCalendlyScript() {
    console.log('Injecting calendly script')
    if (!document.getElementById('calendly-widget-script')) {
      const script = document.createElement('script');
      script.id = 'calendly-widget-script';
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }

  function loadCalendlyScript() {
    return new Promise((resolve, reject) => {
      if (window.Calendly) {
        return resolve();
      }
  
      const existing = document.getElementById('calendly-widget-script');
      if (existing) {
        existing.addEventListener('load', resolve);
        return;
      }
  
      const script = document.createElement('script');
      script.id = 'calendly-widget-script';
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }  

  function injectCalendlyDom() {
    console.log('Injecting calendly dom elements')
    if (!document.getElementById('calendly-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'calendly-overlay';
      overlay.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
      `;
      document.body.appendChild(overlay);
    }
  
    if (!document.getElementById('calendly-embed')) {
      const embed = document.createElement('div');
      embed.id = 'calendly-embed';
      embed.style.cssText = `
        display: none;
        position: fixed;

        
        background-color: transparent;
        z-index: 10000;
        border-radius: 8px;
      `;
      // transform: translate(-50%, -50%);
      // top: 50%;
      // left: 50%;
  
      const close = document.createElement('div');
      close.id = 'calendly-close';
      close.setAttribute('role', 'button');
      close.innerHTML = '×';
      close.style.cssText = `
        position: absolute;
        top: 4px;
        right: 4px;
        cursor: pointer;
        font-size: 28px;
        color: #ff0000;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
      `;
  
      close.addEventListener('click', closeCalendlyModal);
  
      embed.appendChild(close);
      document.body.appendChild(embed);
    }
  }

  function updateCalendlyStyles() {
    console.log('Updating calendly element styles')
    const calendlyEmbed = document.getElementById('calendly-embed')
    const isMobile = isMobileDevice();
    if (isMobile) {
      calendlyEmbed.style.position = 'fixed';
      calendlyEmbed.style.top = '0';
      calendlyEmbed.style.left = '0';
      calendlyEmbed.style.width = '100vw';           
      calendlyEmbed.style.height = '100vh';           
      calendlyEmbed.style.maxWidth = '100vw';
      calendlyEmbed.style.maxHeight = '100vh';
      calendlyEmbed.style.borderRadius = '0';
      calendlyEmbed.style.overflow = 'auto';    
      calendlyEmbed.style.backgroundColor = 'transparent';  
      calendlyEmbed.style.zIndex = '10000';
    } else {
      calendlyEmbed.style.transform = 'translate(-50%, -50%)';
      calendlyEmbed.style.backgroundColor = 'transparent'
      calendlyEmbed.style.top = '50%';
      calendlyEmbed.style.left = '50%';
      calendlyEmbed.style.width = '60%';
      calendlyEmbed.style.minWidth = '1000px'
      calendlyEmbed.style.height = '700px'
      calendlyEmbed.style.borderRadius = '8px'
    }
  }

  async function openCalendlyModal(url) {
    console.log('Opening calendly modal')

    const calendlyScript = document.getElementById('calendly-widget-script')
    if (calendlyScript) {
      console.log('Calendly script in the dom')
    } else {
      console.log('Calendly script not in the dom')
    }

    const overlay = document.getElementById('calendly-overlay');
    const calendlyEmbed = document.getElementById('calendly-embed');
    const existingIframe = calendlyEmbed.querySelector('iframe');
    if (existingIframe) {
      calendlyEmbed.removeChild(existingIframe);
    }

    await loadCalendlyScript();

    if (isMobileDevice()) {
      toggleVisibility('chatbot-container', false);
    };

    Calendly.initInlineWidget({
        url: url,
        parentElement: calendlyEmbed,
        resize: true
      });

    overlay.style.display = 'block';
    calendlyEmbed.style.display = 'block';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function closeCalendlyModal() {
    console.log('Closing calendly modal')
    document.getElementById('calendly-overlay').style.display = 'none';
    document.getElementById('calendly-embed').style.display = 'none';
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';

    if (isMobileDevice()) {
      toggleVisibility('chatbot-container');
    }
  }

  function isCalendlyEvent(e) {
    return e.origin === "https://calendly.com" && e.data.event && e.data.event.indexOf("calendly.") === 0;
  };

  function openGoogleBooking(url) {
    const overlay = document.getElementById('google-overlay');
    const googleEmbed = document.getElementById('google-embed');
    overlay.style.display = 'block';
    googleEmbed.style.display = 'block';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function openAutoOps() {
    AutoOps.show();
  }

  function closeGoogleBooking(e) {
    document.getElementById('google-overlay').style.display = 'none';
    document.getElementById('google-embed').style.display = 'none';
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
  }

  function openBookingLink(url) {
    window.open(url, '_blank')
  }

  // SCHEDULER FUNCITONS END ----------------------------------------------------



  function sendDataToChatbot(data) {
    const iframe = document.getElementById('chatbot-iframe')
    console.log(data)
    // iframe.contentWindow.postMessage(data, 'https://kwixi.ai')
    iframe.contentWindow.postMessage(data, CONFIG.iframeOrigin);
  }
  
  function setThemeColor(color) {
    if (color) {
      if (!document.querySelector('meta[name=theme-color]')) {
        var meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = color;
        document.getElementsByTagName('head')[0].appendChild(meta)
      } 
    }
  }

  function removeThemeColor() {
    if (document.querySelector('meta[name=theme-color]')) {
      var themeColorMeta = document.querySelector('meta[name=theme-color]')
      if (window.storedThemeColor) {
        themeColorMeta.content = window.storedThemeColor;
      } else {
        document.getElementsByTagName('head')[0].removeChild(themeColorMeta);
      }
    }
  }

  const initializeChatbotPosition = (zIndex, bottom, mobileBottom) => {
    const isMobile = isMobileDevice()
    console.log('is mobile:', isMobile)
    const container = document.getElementById('chatbot-container');
    container.style.zIndex = zIndex;
    if (mobileBottom !== undefined) {
      container.dataset.mobileBottom = mobileBottom;
    }

    container.style.bottom = isMobile ? `${mobileBottom}px` : `${bottom}px`;
  }

  const toggleOverflow = (hidden=false) => {
    const value = hidden ? 'hidden' : 'auto';
    document.documentElement.style.overflow = value;
    document.body.style.overflow = value;
  }

  const toggleVisibility = (elementId, show = true) => { 
    const el = document.getElementById(elementId);
    el.style.display = show ? 'block' : 'none'; 
  };

  const resizeChatbot = (container, width, height) => { 
		container.style.width = width;
		container.style.height = height; 
	}; 

  let minimizeTimeoutId;
  function minimizeChatbot() {
    console.log('minimizeChatbot called')
    const container = document.getElementById('chatbot-container');

    const isMobile = isMobileDevice();
    console.log('is window mobile?', isMobile)

    if (isMobile && container.dataset.mobileBottom) {
      container.style.bottom = `${container.dataset.mobileBottom}px`;
    }

    minimizeTimeoutId = setTimeout(() => resizeChatbot(container, '82px', '82px'), 400);
    toggleOverflow()
  }

  function maximizeChatbot() {
    const isMobile = isMobileDevice();
    console.log('maximizeChatbot called')
    clearTimeout(minimizeTimeoutId);
    const container = document.getElementById('chatbot-container');

    resizeChatbot(container, isMobile ? '100%' : '380px', isMobile ? '100%' : '680px');
    if (isMobile) {
      container.style.bottom = '0px';
      toggleOverflow(true);
    } else {
      toggleOverflow();
    };
  }

  function toggleChatbot(state) {
    switch (state) {
      case 'closed':
        // removeThemeColor();
        minimizeChatbot();
        break;

      case 'popup':
        const container = document.getElementById('chatbot-container');
        resizeChatbot(container, '320px', '190px');
        break;
      
      case 'open':
        maximizeChatbot();
        break;

      default:
        if (state) {
          console.warn(`Unhanled resize state: ${state}`)
        } else {
          console.warn(`No resize state provided.`)
        }
        break;
    }
  }


  window.addEventListener('message', function(event) {
      // if (event.origin !== "https://kwixi.ai") return;
      if (event.origin !== CONFIG.iframeOrigin);

      const { action, state } = event.data;
      switch (action) {
        case 'toggleChat':
          toggleChatbot(state)
          break;

        case 'initializeChatbotPosition':
          console.log('Initializing chatbot position')
          const { bottom, zIndex, mobileBottom } = event.data;
          initializeChatbotPosition(zIndex, bottom, mobileBottom);
          break;
        
        case 'openScheduler':
          const { schedulerData } = event.data;
          console.log('opening scheduler');
          openScheduler(schedulerData);
          break;

        default:
          console.warn('Unhandled action:', action)
          break;
      }

  }, false);


})();