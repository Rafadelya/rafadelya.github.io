// Анимация появления элементов при прокрутке
document.addEventListener('DOMContentLoaded', function() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    // Создаем Intersection Observer для анимации при прокрутке
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Небольшая задержка для последовательного появления
                const delay = Array.from(timelineItems).indexOf(entry.target) * 100;
                setTimeout(() => {
                    entry.target.style.transitionDelay = '0s';
                }, delay);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Наблюдаем за каждым элементом таймлайна
    timelineItems.forEach(item => {
        observer.observe(item);
    });

    // Плавная прокрутка для якорных ссылок (если будут добавлены)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Добавляем эффект при наведении на маркеры таймлайна
    timelineItems.forEach(item => {
        const marker = item.querySelector('.timeline-marker');
        const content = item.querySelector('.timeline-content');
        
        marker.addEventListener('mouseenter', () => {
            content.style.transform = 'translateX(10px)';
        });
        
        marker.addEventListener('mouseleave', () => {
            content.style.transform = 'translateX(0)';
        });
    });

    // Показываем первый элемент сразу
    if (timelineItems.length > 0) {
        timelineItems[0].classList.add('visible');
    }
});

// Добавляем эффект параллакса при прокрутке
let lastScrollTop = 0;
window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const timeline = document.querySelector('.timeline');
    
    if (timeline) {
        const timelineRect = timeline.getBoundingClientRect();
        if (timelineRect.top < window.innerHeight && timelineRect.bottom > 0) {
            const parallaxValue = (scrollTop - lastScrollTop) * 0.1;
            timeline.style.transform = `translateY(${parallaxValue}px)`;
        }
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}, false);
