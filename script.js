// Scroll reveal — subtle, once per element
document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.reveal, .frame');

  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    items.forEach(el => io.observe(el));
  } else {
    items.forEach(el => el.classList.add('in-view'));
  }

  // Mobile menu
  const toggle = document.querySelector('.nav-toggle');
  if (toggle){
    toggle.addEventListener('click', () => {
      document.body.classList.toggle('nav-open');
      const expanded = document.body.classList.contains('nav-open');
      toggle.setAttribute('aria-expanded', expanded);
    });
  }
});