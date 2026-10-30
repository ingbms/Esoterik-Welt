// Esoterik-Welt Frontend Application

document.addEventListener('DOMContentLoaded', () => {
  console.log('Esoterik-Welt app initialized');
  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
  
  // CTA button interaction
  const ctaButton = document.querySelector('.cta-button');
  if (ctaButton) {
    ctaButton.addEventListener('click', (e) => {
      e.preventDefault();
      // In a real app, this would navigate to the community page
      console.log('Navigate to community page');
      window.location.href = '/community';
    });
  }
  
  // Feature card hover effects
  const features = document.querySelectorAll('.feature');
  features.forEach(feature => {
    feature.addEventListener('mouseenter', () => {
      feature.style.boxShadow = '0 20px 40px rgba(212, 165, 116, 0.15)';
    });
    feature.addEventListener('mouseleave', () => {
      feature.style.boxShadow = 'none';
    });
  });
  
  // API health check
  fetch('/api/health')
    .then(response => response.json())
    .then(data => {
      console.log('API Health:', data);
    })
    .catch(err => {
      console.warn('API health check failed:', err);
    });
});