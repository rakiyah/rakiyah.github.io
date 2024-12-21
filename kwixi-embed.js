(function () {
  console.log('Script loaded!');

  const config = window.kwixiConfig || {};
  const clientId = config.clientId;

  if (!clientId) {
    console.log('Client Id not found');
    return;
  }
  console.log('Client ID:', clientId)

  const container = document.getElementById("chatbot-container");
  if (container) {
    console.log('Chatbot container found', container);
  } else {
    console.log('Chatbot container not found.');
  }

  const chatbotSrc = `https://kwixi.ai/client/${clientId}/`
  container.innerHTML = `
    <iframe id="chatbot-iframe"
      src=${chatbotSrc}
      style="width: 100%; height: 100%; border: none; position: fixed; right: 0; bottom: 0;"
      scrolling="no">
    </iframe>
  `;
  function preventDefault(e) {
    e.preventDefault();
  }
  function isMobileDevice() {
    return window.innerWidth <= 768;
  };
  // function getThemeColor() {
  //   if (document.querySelector('meta[name=theme-color]')) {
  //     var themeColorMeta = document.querySelector('meta[name=theme-color]');
  //     const themeColor = themeColorMeta.content;
  //     return themeColor;
  //   } else { return null };
  // };
  window.isMobile = isMobileDevice();
  // window.storedThemeColor = getThemeColor();
  function sendMobileStatusToIframe() {
    const iframe = document.getElementById('chatbot-iframe');
    iframe.contentWindow.postMessage({ action: 'isMobileResponse', isMobile: window.isMobile }, `https://kwixi.ai/client/${clientId}/`);
  }
  window.addEventListener('resize', () => {
    sendMobileStatusToIframe();
    window.isMobile = isMobileDevice();
  });
  window.addEventListener('load', () => {
    const container = document.getElementById('chatbot-container');
    container.style.width = '82px';
    container.style.height = '82px';
    sendMobileStatusToIframe();
  });
  function addCalendlyElements() {
    // Calendly Overlay
    const calendlyOverlay = document.createElement("div");
    calendlyOverlay.id = "calendly-overlay";
    calendlyOverlay.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
    `;
    document.body.appendChild(calendlyOverlay);

    // Calendly Embed
    const calendlyEmbed = document.createElement("div");
    calendlyEmbed.id = "calendly-embed";
    calendlyEmbed.style.cssText = `
      display: none;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: transparent;
      z-index: 10000;
      border-radius: 8px;
    `;

    // Close Button
    const closeButton = document.createElement("div");
    closeButton.id = "calendly-close";
    closeButton.role = "button";
    closeButton.innerHTML = "&times;";
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      cursor: pointer;
      font-size: 28px;
      color: #ff0000;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1001;
    `;
    calendlyEmbed.appendChild(closeButton);
    document.body.appendChild(calendlyEmbed);

    // Close Button Event Listener
    closeButton.addEventListener("click", closeCalendlyModal);
  }
  function updateCalendlyStyles() {
    const calendlyEmbed = document.getElementById('calendly-embed')
    if (window.isMobile) {
      calendlyEmbed.style.width = '400px'
      calendlyEmbed.style.maxWidth = '500px'
      calendlyEmbed.style.maxHeight = '660px'
      calendlyEmbed.style.overflow = 'scroll'
    } else {
      calendlyEmbed.style.backgroundColor = 'transparent'
      calendlyEmbed.style.width = '60%'
      calendlyEmbed.style.minWidth = '1000px'
      calendlyEmbed.style.height = '700px'
      calendlyEmbed.style.borderRadius = '8px'
    }
  }

  addCalendlyElements();

  window.addEventListener("message", function(e) {
    if(isCalendlyEvent(e)) {
      if(e.data.event === "calendly.event_scheduled") {
        sendDataToChatbot({ action: 'storeMeeting', meetingDetails: e.data.payload }) 
      }
    }});
  document.getElementById('calendly-close').addEventListener('click', function() {
    closeCalendlyModal()
  })

  function openCalendlyModal(url) {
    updateCalendlyStyles()
    const overlay = document.getElementById('calendly-overlay');
    const calendlyEmbed = document.getElementById('calendly-embed');
    const existingIframe = calendlyEmbed.querySelector('iframe');
    if (existingIframe) {
      calendlyEmbed.removeChild(existingIframe);
    }
    Calendly.initInlineWidget({
        url: url,
        parentElement: calendlyEmbed,
        resize: true
      });
    // }
    overlay.style.display = 'block';
    calendlyEmbed.style.display = 'block';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
  function closeCalendlyModal() {
    document.getElementById('calendly-overlay').style.display = 'none';
    document.getElementById('calendly-embed').style.display = 'none';
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
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
  function sendDataToChatbot(data) {
    const iframe = document.getElementById('chatbot-iframe')
    console.log(data)
    iframe.contentWindow.postMessage(data, 'https://kwixi.ai')
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
  let minimizeTimeoutId;
  function minimizeChatbot() {
    const container = document.getElementById('chatbot-container');
    minimizeTimeoutId = setTimeout(() => {
      container.style.width = '82px';
      container.style.height = '82px';
    }, 400);

    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
  }
  function maximizeChatbot(isMobile) { 
    clearTimeout(minimizeTimeoutId);
    const container = document.getElementById('chatbot-container');
    let newWidth;
    let newHeight;
    if (isMobile) {
      newHeight = '100%';
      newWidth = '100%';
    } else {
      newHeight = '680px';
      newWidth = '380px';
    }
    container.style.width = newWidth;
    container.offsetWidth;
    container.style.height = newHeight;
  }
  window.addEventListener('message', function(event) {
      if (event.origin !== "https://kwixi.ai") return;
      var container = document.getElementById('chatbot-container');
      if (event.data.action === 'resize' && event.data.state) {
        
        const state = event.data.state;
        if (state === 'closed') {
          removeThemeColor()
          minimizeChatbot()

        } else if (state === 'popup') {
          removeThemeColor()
          container.style.width = '320px'
          container.style.height = '190px'
          document.documentElement.style.overflow = 'auto';
          document.body.style.overflow = 'auto'
        } else if (state === 'open') {
          isMobile = window.isMobile;
          maximizeChatbot(isMobile);
          if (isMobile) {
              document.documentElement.style.setProperty('overflow', 'hidden', 'important');
              document.body.style.setProperty('overflow', 'hidden', 'important');
          } else {
            document.documentElement.style.overflow = 'auto';
            document.body.style.overflow = 'auto';
          }
        }
      }
      if (event.data.action === 'setBottomPosition') {
        if (!window.isMobile) {
          container.style.bottom = `${event.data.bottom}px`;
        }
      }
      if (event.data.action === 'setZIndex') {
        const container = document.getElementById('chatbot-container');
        container.style.zIndex = `${event.data.zIndex}`;
      }
      if (event.data.action === 'openCalendlyModal') {
        openCalendlyModal(event.data.url);
      } else if (event.data.action === 'openGoogleBooking') {
        openBookingLink(event.data.url)
      } else if (event.data.action === 'openBookingLink') {
        openBookingLink(event.data.url)
      } else if (event.data.action === 'openAutoOps') {
        openAutoOps()
      }
  }, false);


})();