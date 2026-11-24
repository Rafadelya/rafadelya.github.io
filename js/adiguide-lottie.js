(function () {
  var root = document.querySelector('[data-adi-lottie]');
  if (!root) return;

  var stage = root.querySelector('[data-adi-lottie-stage]');
  var section = root.closest('.adi-cities');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var smallViewport = window.matchMedia('(max-width: 680px)');
  var animation = null;
  var isVisible = false;
  var isPointerInside = false;
  var isLoaded = false;
  var didPlayMobileOpen = false;
  var pendingSegment = null;
  var idleSegment = [0, 100];
  var hoverSegment = [117, 196];
  var closeSegment = [196, 240];
  var mobileOpenSegment = [304, 372];
  var lottieWaitAttempts = 0;
  var assetMap = {
    '2.png': '1.jpg',
    '4.png': '8.jpg',
    '6.png': '10.jpg',
    '8.png': '11.jpg',
    '10.png': '12.jpg'
  };

  if (section) section.classList.add('is-observed');

  function setFallback(reason) {
    root.classList.remove('is-ready', 'is-loading');
    root.classList.add('is-fallback');
    if (reason) {
      root.dataset.lottieState = reason;
    }
  }

  function applyLocalAssets(data) {
    var basePath = new URL('../assets/adiguide/', window.location.href).href;
    if (!Array.isArray(data.assets)) return data;

    data.assets.forEach(function (asset) {
      if (!assetMap[asset.p]) return;
      asset.u = basePath;
      asset.p = assetMap[asset.p];
      asset.e = 0;
    });

    return data;
  }

  function playSegment(segment, loop) {
    if (!animation || !isLoaded || reduceMotion.matches || !isVisible) {
      pendingSegment = { segment: segment, loop: loop };
      return;
    }

    animation.loop = Boolean(loop);
    animation.playSegments(segment, true);
  }

  function playIdle() {
    playSegment(idleSegment, true);
  }

  function playIntro() {
    if (smallViewport.matches && !didPlayMobileOpen) {
      didPlayMobileOpen = true;
      playSegment(mobileOpenSegment, false);
      return;
    }

    playIdle();
  }

  function destroyAnimation() {
    if (animation) {
      animation.destroy();
      animation = null;
    }
    isLoaded = false;
    pendingSegment = null;
  }

  function hydrateAnimation() {
    if (animation || root.classList.contains('is-loading') || reduceMotion.matches) {
      if (reduceMotion.matches) setFallback('reduced-motion');
      return;
    }

    if (!stage) {
      setFallback('lottie-unavailable');
      return;
    }

    if (!window.lottie) {
      lottieWaitAttempts += 1;
      if (lottieWaitAttempts <= 30) {
        window.setTimeout(hydrateAnimation, 100);
      } else {
        setFallback('lottie-unavailable');
      }
      return;
    }

    root.classList.add('is-loading');

    fetch('../assets/adiguide/card_animations.json')
      .then(function (response) {
        if (!response.ok) throw new Error('Animation request failed');
        return response.json();
      })
      .then(function (data) {
        animation = window.lottie.loadAnimation({
          container: stage,
          renderer: 'svg',
          loop: false,
          autoplay: false,
          animationData: applyLocalAssets(data),
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid meet',
            progressiveLoad: true,
            title: 'Анимированные карточки маршрутов АдиГида'
          }
        });

        animation.addEventListener('DOMLoaded', function () {
          isLoaded = true;
          root.classList.remove('is-loading');
          root.classList.add('is-ready');

          if (pendingSegment) {
            playSegment(pendingSegment.segment, pendingSegment.loop);
            pendingSegment = null;
          } else {
            playIntro();
          }
        });

        animation.addEventListener('complete', function () {
          if (!isPointerInside) playIdle();
        });
      })
      .catch(function () {
        destroyAnimation();
        setFallback('load-error');
      });
  }

  function pauseIfHidden() {
    if (document.hidden && animation) {
      animation.pause();
    } else if (isVisible && animation && isLoaded && !reduceMotion.matches) {
      animation.play();
    }
  }

  root.addEventListener('mouseenter', function () {
    isPointerInside = true;
    playSegment(hoverSegment, false);
  });

  root.addEventListener('mouseleave', function () {
    isPointerInside = false;
    playSegment(closeSegment, false);
  });

  root.addEventListener('focusin', function () {
    isPointerInside = true;
    playSegment(hoverSegment, false);
  });

  root.addEventListener('focusout', function () {
    isPointerInside = false;
    playSegment(closeSegment, false);
  });

  document.addEventListener('visibilitychange', pauseIfHidden);

  reduceMotion.addEventListener('change', function () {
    if (reduceMotion.matches) {
      destroyAnimation();
      setFallback('reduced-motion');
    } else if (isVisible) {
      root.classList.remove('is-fallback');
      hydrateAnimation();
    }
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        isVisible = entry.isIntersecting;
        if (section) section.classList.toggle('is-in-view', isVisible);
        if (isVisible) {
          hydrateAnimation();
          if (animation && isLoaded && !reduceMotion.matches) animation.play();
        } else if (animation) {
          animation.pause();
        }
      });
    }, { rootMargin: '240px 0px' }).observe(root);
  } else {
    isVisible = true;
    if (section) section.classList.add('is-in-view');
    hydrateAnimation();
  }
}());
